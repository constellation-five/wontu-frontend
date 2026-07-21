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
import { LocationStateService, DEFAULT_LOCATION } from '../../core/location-state.service';
import { LocationLookupService } from '../../core/location-lookup.service';
import { Offer, OfferService } from '../../core/offer.service';
import { ProfileService } from '../../core/profile.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MainPageHeaderComponent } from '../../shared/components/main-page-header/main-page-header';
import { ActivityCardComponent } from './activity-card/activity-card';
import { LocationPickerDialog } from '../../shared/components/location-picker-dialog/location-picker-dialog';

interface ActivityItem {
  id: number;
  type: 'Order' | 'Offer';
  category: string;
  merchantName: string;
  itemName: string;
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
  private readonly locationLookup = inject(LocationLookupService);
  private readonly offerService = inject(OfferService);
  private readonly profileService = inject(ProfileService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly datePipe = new DatePipe('en-US');
  private readonly naturalPipe = new NaturalDateTimePipe();
  
  readonly userLocation = this.locationState.userLocation;
  readonly userLocationCoordinates = this.locationState.userLocationCoordinates;

  orders = signal<ActivityItem[]>([]);
  offers = signal<ActivityItem[]>([]);
  
  searchQuery = signal('');
  filterOrder = signal<boolean>(true);
  filterOffer = signal<boolean>(true);
  
  isLoading = signal<boolean>(true);
  tabOptions = [$localize`History`, $localize`Ongoing`];
  activeTab = signal<string>(this.tabOptions[1]);

  combinedItems = computed(() => {
    return [...this.orders(), ...this.offers()]
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  filteredItems = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const isHistoryTab = this.activeTab() === this.tabOptions[0];
    const showOrder = this.filterOrder();
    const showOffer = this.filterOffer();
    
    return this.combinedItems().filter(item => {
      const matchesSearch = item.merchantName.toLowerCase().includes(search) ||
                            item.itemName.toLowerCase().includes(search) ||
                            item.locationLabel.toLowerCase().includes(search) ||
                            item.statusText.toLowerCase().includes(search) ||
                            item.dateStr.toLowerCase().includes(search);
      const matchesTab = item.isHistory === isHistoryTab;
      const matchesType = (item.type === 'Order' && showOrder) || (item.type === 'Offer' && showOffer);
      return matchesSearch && matchesTab && matchesType;
    });
  });

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }

  constructor() {
    this.pageHeader.setTitle('Activity');
    
    if (!this.userLocationCoordinates()) {
      this.detectCurrentLocation();
    }
    
    this.loadData();
  }

  onChangeLocation() {
    const dialogRef = this.dialog.open(LocationPickerDialog, {
      width: '500px',
      data: {
        coords: this.userLocationCoordinates() ?? undefined,
        label: this.userLocation() !== DEFAULT_LOCATION ? this.userLocation() : undefined,
      },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.location) {
        this.locationState.isManuallySet.set(true);
        this.userLocation.set(result.location);
        this.userLocationCoordinates.set(result.coords ?? null);
      }
    });
  }

  private detectCurrentLocation(retriesLeft = 2) {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        this.applyDetectedLocation(coords);
      },
      (error) => {
        console.log('Geolocation error:', error);
        if (error.code === error.POSITION_UNAVAILABLE && retriesLeft > 0) {
          setTimeout(() => this.detectCurrentLocation(retriesLeft - 1), 2000);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  private async applyDetectedLocation(coords: { lat: number; lng: number }) {
    if (this.locationState.isManuallySet()) {
      return;
    }

    this.userLocationCoordinates.set(coords);

    try {
      this.userLocation.set(await this.locationLookup.resolvePlaceName(coords));
    } catch (err) {
      console.log('Location lookup error:', err);
      this.userLocation.set(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    }
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
          const itemName = firstItem?.item?.item_name || '';
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
                prefix = $localize`Arrives `;
             } else { // Waiting to close
                dateToUse = order.closing_time ? new Date(order.closing_time) : orderDate;
                prefix = $localize`Closes `;
             }
          }
          
          const rawDate = this.naturalPipe.transform(dateToUse);
          const finalDateStr = status.isHistory ? rawDate : prefix + rawDate.toLowerCase();
          
          return {
            id: order.offer_id,
            type: 'Order',
            category: order.category,
            merchantName: order.merchant_name,
            itemName,
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
          const itemName = offer.items[0]?.item_name || '';
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
                prefix = $localize`Arrives `;
             } else { // Waiting to close
                dateToUse = offer.closing_time ? new Date(offer.closing_time) : offerDate;
                prefix = $localize`Closes `;
             }
          }

          const rawDate = this.naturalPipe.transform(dateToUse);
          const finalDateStr = status.isHistory ? rawDate : prefix + rawDate.toLowerCase();

          return {
            id: offer.offer_id,
            type: 'Offer',
            category: offer.category,
            merchantName: offer.merchant_name,
            itemName,
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
          this.activeTab.set(this.tabOptions[0]);
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
    if (order.arrived_at) return { text: $localize`Items arrive`, color: 'var(--mat-sys-success)', isHistory: true };
    if (order.is_confirmed) return { text: $localize`Payment confirmed`, color: 'var(--mat-sys-secondary)', isHistory: false };
    if (order.payment_submitted_at) return { text: $localize`Payment made`, color: 'var(--mat-sys-secondary)', isHistory: false };
    if (order.closed_at) return { text: $localize`Offer closed`, color: 'var(--mat-sys-secondary)', isHistory: false };
    return { text: $localize`Offer joined`, color: 'var(--mat-sys-secondary)', isHistory: false };
  }

  // --- Status Mappings for Offers ---
  private getOfferStatus(offer: Offer) {
    if (offer.arrived_at) return { text: $localize`Items arrived`, color: 'var(--mat-sys-success)', isHistory: true };
    if (offer.payments_confirmed_at) return { text: $localize`Payments confirmed`, color: 'var(--mat-sys-secondary)', isHistory: false };
    if (offer.closed_at) return { text: $localize`Offer closed`, color: 'var(--mat-sys-secondary)', isHistory: false };
    return { text: $localize`Offer opened`, color: 'var(--mat-sys-secondary)', isHistory: false };
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