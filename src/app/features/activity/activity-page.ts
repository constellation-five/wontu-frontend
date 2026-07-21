import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { NaturalDateTimePipe } from '../../shared/pipes/natural-date-time.pipe';
import { GiveRatingDialog } from '../../shared/components/give-rating-dialog/give-rating-dialog';
import { SegmentedControlComponent } from '../../shared/components/segmented-control/segmented-control';
import { PageHeaderService } from '../../core/page-header.service';
import { LocationStateService } from '../../core/location-state.service';
import { Offer, OfferService } from '../../core/offer.service';
import { ProfileService } from '../../core/profile.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MainPageHeaderComponent } from '../../shared/components/main-page-header/main-page-header';
import { ActivityCardComponent } from './activity-card/activity-card';

interface ActivityItem {
  id: number;
  type: 'Order' | 'Offer';
  merchantName: string;
  merchantId?: string;
  locationLabel: string;
  dateStr: string;
  timestamp: number;
  statusText: string;
  statusColor: string;
  imageUrl: string;
  isHistory: boolean;
  totalPrice: number;
  isRated?: boolean;
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
    MatProgressSpinnerModule,
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
  private readonly profileService = inject(ProfileService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly datePipe = new DatePipe('en-US');
  private readonly naturalPipe = new NaturalDateTimePipe();
  
  readonly userLocation = this.locationState.userLocation;

  orders = signal<ActivityItem[]>([]);
  offers = signal<ActivityItem[]>([]);
  
  searchQuery = signal('');
  filterOrder = signal<boolean>(true);
  filterOffer = signal<boolean>(true);
  
  isLoading = signal<boolean>(true);
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
      const matchesSearch = item.merchantName.toLowerCase().includes(search) ||
                            item.locationLabel.toLowerCase().includes(search) ||
                            item.statusText.toLowerCase().includes(search) ||
                            item.dateStr.toLowerCase().includes(search);
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
    this.isLoading.set(true);
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
          let dateToUse: Date;
          let prefix = '';

          if (status.isHistory) {
             dateToUse = order.arrived_at ? new Date(order.arrived_at) : orderDate;
             prefix = '';
          } else {
             if (order.closed_at) { // Waiting to arrive
                dateToUse = order.arrival_time ? new Date(order.arrival_time) : orderDate;
                prefix = 'Arrives ';
             } else { // Waiting to close
                dateToUse = order.closing_time ? new Date(order.closing_time) : orderDate;
                prefix = 'Closes ';
             }
          }
          
          const rawDate = this.naturalPipe.transform(dateToUse);
          const finalDateStr = status.isHistory ? rawDate : prefix + rawDate.toLowerCase();
          
          return {
            id: order.offer_id,
            type: 'Order',
            merchantName: order.merchant_name,
            merchantId: order.merchant_id,
            locationLabel: order.location_label || '',
            dateStr: finalDateStr,
            timestamp: dateToUse.getTime(),
            statusText: status.text,
            statusColor: status.color,
            imageUrl,
            isHistory: status.isHistory,
            totalPrice,
            isRated: order.is_rated
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
          let dateToUse: Date;
          let prefix = '';

          if (status.isHistory) {
             dateToUse = offer.arrived_at ? new Date(offer.arrived_at) : offerDate;
             prefix = '';
          } else {
             if (offer.closed_at) { // Waiting to arrive
                dateToUse = offer.arrival_time ? new Date(offer.arrival_time) : offerDate;
                prefix = 'Arrives ';
             } else { // Waiting to close
                dateToUse = offer.closing_time ? new Date(offer.closing_time) : offerDate;
                prefix = 'Closes ';
             }
          }

          const rawDate = this.naturalPipe.transform(dateToUse);
          const finalDateStr = status.isHistory ? rawDate : prefix + rawDate.toLowerCase();

          return {
            id: offer.offer_id,
            type: 'Offer',
            merchantName: offer.merchant_name,
            locationLabel: offer.location_label || '',
            dateStr: finalDateStr,
            timestamp: dateToUse.getTime(),
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
        if (!hasOngoing) {
          this.activeTab.set('History');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load activity data:', err);
        this.isLoading.set(false);
      },
    });
  }

  private formatDate(date: Date): string {
    return this.datePipe.transform(date, 'dd MMM yyyy, HH:mm') || '';
  }

  // --- Status Mappings for Orders ---
  private getOrderStatus(order: any) {
    if (order.arrived_at) return { text: 'Items arrive', color: 'var(--mat-sys-success)', isHistory: true };
    if (order.is_confirmed) return { text: 'Payment confirmed', color: 'var(--mat-sys-secondary)', isHistory: false };
    if (order.payment_submitted_at) return { text: 'Payment made', color: 'var(--mat-sys-secondary)', isHistory: false };
    if (order.closed_at) return { text: 'Offer closed', color: 'var(--mat-sys-secondary)', isHistory: false };
    return { text: 'Offer joined', color: 'var(--mat-sys-secondary)', isHistory: false };
  }

  // --- Status Mappings for Offers ---
  private getOfferStatus(offer: Offer) {
    if (offer.arrived_at) return { text: 'Items arrived', color: 'var(--mat-sys-success)', isHistory: true };
    if (offer.payments_confirmed_at) return { text: 'Payments confirmed', color: 'var(--mat-sys-secondary)', isHistory: false };
    if (offer.closed_at) return { text: 'Offer closed', color: 'var(--mat-sys-secondary)', isHistory: false };
    return { text: 'Offer opened', color: 'var(--mat-sys-secondary)', isHistory: false };
  }

  viewDetail(item: ActivityItem) {
    this.router.navigate(['/offers', item.id]);
  }
  
  openRatingDialog(item: ActivityItem) {
    if (!item.merchantId) return;

    const dialogRef = this.dialog.open(GiveRatingDialog, {
      width: '90%',
      maxWidth: '400px',
      panelClass: 'give-rating-dialog-panel',
      data: {
        merchantName: item.merchantName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.rating) {
        this.profileService.rateSeller(item.merchantId!, result.rating, item.id).subscribe({
          next: () => {
            this.snackBar.open('Rating submitted successfully', 'Close', { duration: 3000 });
            this.orders.update(orders => 
              orders.map(o => o.id === item.id && o.type === 'Order' ? { ...o, isRated: true } : o)
            );
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to submit rating', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}