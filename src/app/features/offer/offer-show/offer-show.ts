import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/auth.service';
import { OfferService, Offer } from '../../../core/offer.service';
import { PageHeaderService } from '../../../core/page-header.service';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar';
import { MerchantCardComponent } from '../../../shared/components/merchant-card/merchant-card';
import { NotificationBellComponent, Notification } from '../../../shared/components/notification-bell/notification-bell';
import { LocationPickerDialog } from '../../../shared/components/location-picker-dialog/location-picker-dialog';

@Component({
  selector: 'offer-show',
  templateUrl: './offer-show.html',
  styleUrls: ['./offer-show.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    SearchBarComponent,
    MerchantCardComponent,
    NotificationBellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferShowPage {
  private readonly auth = inject(AuthService);
  private readonly offerService = inject(OfferService);
  private readonly router = inject(Router);
  private readonly pageHeader = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);

  readonly user = this.auth.user;
  readonly offers = this.offerService.allOffers;
  readonly isLoading = this.offerService.isLoading;

  searchQuery = signal<string>('');
  filterFood = signal<boolean>(true);
  filterOther = signal<boolean>(true);
  userLocation = signal<string>('Choose your location');
  userLocationCoordinates = signal<{ lat: number; lng: number } | null>(null);
  userNotifications = signal<Notification[]>([]);

  filteredOffers = computed(() => {
    const allOffers = this.offers();
    const food = this.filterFood();
    const other = this.filterOther();

    if (food && other) {
      return allOffers;
    }

    if (!food && !other) {
      return [];
    }

    return allOffers.filter((offer) => {
      const category = offer.category.toLowerCase();
      if (food && category === 'food') return true;
      if (other && category === 'other') return true;
      return false;
    });
  });

  constructor() {
    this.pageHeader.setTitle('Offers');
    this.pageHeader.setBreadcrumbs([{ label: 'Offers', route: '/offers' }]);
    this.initializeNotifications();
    this.fetchOffers();
  }

  fetchOffers(query?: string) {
    this.offerService.loadOffers(query).subscribe({
      error: (err) => console.error('Error fetching offers:', err),
    });
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.fetchOffers(query);
  }

  onCardClick(offerId: number) {
    this.router.navigate(['/offers', offerId]);
  }

  openCreateOffer() {
    this.router.navigate(['/offers/create']);
  }

  getPriceRange(offer: Offer): string {
    if (!offer.items || offer.items.length === 0) {
      return 'No Price';
    }

    const prices = offer.items.map((item) => +item.item_price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `Rp ${minPrice.toLocaleString('id-ID')}`;
    }

    return `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
  }

  getStockLeft(offer: Offer): number {
    if (!offer.items || offer.items.length === 0) {
      return 0;
    }

    return offer.items.reduce((total, item) => total + (item.slot - item.current_slot), 0);
  }

  initializeNotifications() {
    this.userNotifications.set([
      {
        id: '1',
        title: 'Order Confirmed',
        message: 'Your order for Martabakku Love has been confirmed',
        timestamp: '5 min ago',
        read: false,
      },
      {
        id: '2',
        title: 'New Offer',
        message: 'Check out the new martabak offer near you',
        timestamp: '1 hour ago',
        read: false,
      },
      {
        id: '3',
        title: 'Order Delivered',
        message: 'Your order has been delivered successfully',
        timestamp: '2 hours ago',
        read: true,
      },
    ]);
  }

  onMarkAllNotificationsRead() {
    this.userNotifications.update((notifications) =>
      notifications.map((n) => ({ ...n, read: true }))
    );
  }

  onMarkNotificationAsRead(notificationId: string) {
    this.userNotifications.update((notifications) =>
      notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }

  onChangeLocation() {
    this.requestGeolocationPermission();
  }

  private requestGeolocationPermission() {
    if (!navigator.geolocation) {
      this.showLocationPickerDialog();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.showLocationPickerDialog(position.coords);
      },
      (error) => {
        console.log('Geolocation error:', error);
        this.showLocationPickerDialog();
      }
    );
  }

  private showLocationPickerDialog(coords?: GeolocationCoordinates) {
    const dialogRef = this.dialog.open(LocationPickerDialog, {
      width: '500px',
      maxWidth: '90vw',
      data: { coords },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.location) {
        this.userLocation.set(result.location);
        this.userLocationCoordinates.set(result.coords ? {
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        } : null);
      }
    });
  }
}
