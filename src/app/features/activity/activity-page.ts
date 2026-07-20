import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { NaturalDateTimePipe } from '../../shared/pipes/natural-date-time.pipe';
import { RatingDialog } from '../profile/rating/rating-dialog';
import { SegmentedControlComponent } from '../../shared/components/segmented-control/segmented-control';
import { PageHeaderService } from '../../core/page-header.service';
import { LocationStateService } from '../../core/location-state.service';
import { Offer, OfferService } from '../../core/offer.service';
import { MainPageHeaderComponent } from '../../shared/components/main-page-header/main-page-header';
import { ActivityCardComponent } from './activity-card/activity-card';

interface ActivityItem {
  id: number;
  type: 'Order' | 'Offer';
  merchantName: string;
  locationLabel: string;
  dateStr: string;
  timestamp: number;
  statusText: string;
  statusColor: string;
  imageUrl: string;
  isHistory: boolean;
  totalPrice: number;
}

@Component({
  selector: 'activity-page',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MainPageHeaderComponent,
    ActivityCardComponent,
    MatCheckboxModule,
    MatDialogModule,
    SegmentedControlComponent
  ],
  templateUrl: './activity-page.html',
  styleUrls: ['./activity-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPage {
  private readonly router = inject(Router);
  protected readonly pageHeader = inject(PageHeaderService);
  private readonly locationState = inject(LocationStateService);
  private readonly offerService = inject(OfferService);
  private readonly dialog = inject(MatDialog);
  private readonly datePipe = new DatePipe('en-US');
  private readonly naturalPipe = new NaturalDateTimePipe();
  
  readonly userLocation = this.locationState.userLocation;

  orders = signal<ActivityItem[]>([]);
  offers = signal<ActivityItem[]>([]);
  
  searchQuery = signal('');
  filterOrder = signal<boolean>(true);
  filterOffer = signal<boolean>(true);
  
  activeTab = signal<'History' | 'Ongoing'>('Ongoing');

  combinedItems = computed(() => {
    return [...this.orders(), ...this.offers()]
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  filteredItems = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const isHistoryTab = this.activeTab() === 'History';
    const showOrder = this.filterOrder();
    const showOffer = this.filterOffer();
    
    return this.combinedItems().filter(item => {
      const matchesSearch = item.merchantName.toLowerCase().includes(search);
      const matchesTab = item.isHistory === isHistoryTab;
      const matchesType = (item.type === 'Order' && showOrder) || (item.type === 'Offer' && showOffer);
      return matchesSearch && matchesTab && matchesType;
    });
  });

  onTabChange(tab: string) {
    this.activeTab.set(tab as 'History' | 'Ongoing');
  }

  constructor() {
    this.pageHeader.setTitle('Activity');
    this.loadData();
  }

  private loadData() {
    forkJoin({
      ordersRes: this.offerService.getMyOrders(),
      offersRes: this.offerService.getMyOffers()
    }).subscribe({
      next: ({ ordersRes, offersRes }) => {
        // Process Orders
        const mappedOrders: ActivityItem[] = (ordersRes.data || []).map((order: any) => {
          const firstItem = order.items[0];
          const imageUrl = firstItem?.item?.image_url || '';
          const orderDate = new Date(order.created_at);
          let totalPrice = 0;
          if (order.items) {
            order.items.forEach((ci: any) => {
              totalPrice += ci.quantity * Number(ci.item.item_price);
            });
          }
          
          const status = this.getOrderStatus(order);
          const prefix = status.isHistory ? '' : (order.closed_at ? 'Arrives ' : 'Closes ');
          const rawDate = this.naturalPipe.transform(orderDate);
          const finalDateStr = status.isHistory ? rawDate : prefix + rawDate.toLowerCase();
          
          return {
            id: order.offer_id,
            type: 'Order',
            merchantName: order.merchant_name,
            locationLabel: order.location_label || '',
            dateStr: finalDateStr,
            timestamp: orderDate.getTime(),
            statusText: status.text,
            statusColor: status.color,
            imageUrl,
            isHistory: status.isHistory,
            totalPrice
          };
        });
        this.orders.set(mappedOrders);

        // Process Offers
        const mappedOffers: ActivityItem[] = (offersRes.data || []).map((offer: Offer) => {
          const imageUrl = offer.items[0]?.image_url || '';
          const offerDate = new Date(offer.created_at);

          let totalPrice = 0;
          if (offer.items) {
            offer.items.forEach((oi: any) => {
              const sold = oi.slot - oi.current_slot;
              totalPrice += sold * Number(oi.item_price);
            });
          }

          const status = this.getOfferStatus(offer);
          const prefix = status.isHistory ? '' : (offer.closed_at ? 'Arrives ' : 'Closes ');
          const rawDate = this.naturalPipe.transform(offerDate);
          const finalDateStr = status.isHistory ? rawDate : prefix + rawDate.toLowerCase();

          return {
            id: offer.offer_id,
            type: 'Offer',
            merchantName: offer.merchant_name,
            locationLabel: offer.location_label || '',
            dateStr: finalDateStr,
            timestamp: offerDate.getTime(),
            statusText: status.text,
            statusColor: status.color,
            imageUrl,
            isHistory: status.isHistory,
            totalPrice
          };
        });
        this.offers.set(mappedOffers);

        // Smart Default Tab: If no ongoing items, switch to History
        const hasOngoing = this.combinedItems().some(item => !item.isHistory);
        if (!hasOngoing && this.combinedItems().length > 0) {
          this.activeTab.set('History');
        }
      },
      error: (err) => console.error('Failed to load activity data:', err),
    });
  }

  private formatDate(date: Date): string {
    return this.datePipe.transform(date, 'dd MMM yyyy, HH:mm') || '';
  }

  // --- Status Mappings for Orders ---
  private getOrderStatus(order: any) {
    if (order.arrived_at) return { text: 'Items arrive', color: 'var(--mat-sys-success)', isHistory: true };
    if (order.is_confirmed) return { text: 'Payment confirmed', color: '#E68A00', isHistory: false };
    if (order.payment_submitted_at) return { text: 'Payment made', color: '#E68A00', isHistory: false };
    if (order.closed_at) return { text: 'Offer closes', color: 'var(--mat-sys-error)', isHistory: true };
    return { text: 'Offer joined', color: '#E68A00', isHistory: false };
  }

  // --- Status Mappings for Offers ---
  private getOfferStatus(offer: Offer) {
    if (offer.arrived_at) return { text: 'Items arrived', color: 'var(--mat-sys-success)', isHistory: true };
    if (offer.payments_confirmed_at) return { text: 'Payments confirmed', color: '#E68A00', isHistory: false };
    if (offer.closed_at) return { text: 'Offer closed', color: '#E68A00', isHistory: true };
    return { text: 'Offer opened', color: '#E68A00', isHistory: false };
  }

  viewDetail(item: ActivityItem) {
    this.router.navigate(['/offers', item.id]);
  }
  
  openRatingDialog(item: ActivityItem) {
    this.dialog.open(RatingDialog, {
      width: '90%',
      maxWidth: '400px',
      panelClass: 'rating-dialog-panel'
    });
  }
}