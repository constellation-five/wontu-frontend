import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { Auth } from '../../../core/auth';
import { OfferService, Offer } from '../../../core/offer'; // Tambahkan import Offer
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CardItemComponent } from '../../../shared/components/card-item'; // Import CardItemComponent
import {
  NotificationBellComponent,
  Notification,
} from '../../../shared/components/notification-bell/notification-bell';
import { LocationPickerDialog } from './location-picker-dialog';

@Component({
  selector: 'offer-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDialogModule,
    CardItemComponent, // Ganti dari OfferCardComponent
    NotificationBellComponent,
  ],
  templateUrl: './offer-page.html',
  styleUrls: ['./offer-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferPage implements OnInit {
  private readonly auth = inject(Auth);
  private readonly offerService = inject(OfferService); // Inject OfferService
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  userName: string = 'Guest';
  userLocation: string = 'Choose your location';
  userLocationCoordinates: { lat: number; lng: number } | null = null;

  // Menggunakan Signal dari service untuk data offers dan loading state
  readonly offers = this.offerService.allOffers;
  readonly isLoading = this.offerService.isLoading;

  searchQuery: string = '';
  selectedFilter: string = 'all';
  isFilterMenuOpen: boolean = false;

  userNotifications: Notification[] = [];

  // Data dummy dihapus, sekarang sumber datanya adalah this.offers() dari Signal

  filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'food', label: 'Food' },
    { value: 'other', label: 'Other' },
  ];

  ngOnInit() {
    this.initializeNotifications();
    this.loadUserData();
    this.fetchOffers(); // Ambil data dari BE saat init
  }

  loadUserData() {
    const user = this.auth.user();
    if (user && user.name) {
      this.userName = user.name;
      this.cdr.markForCheck();
    }
  }

  // Fungsi baru untuk memicu loading data dari API Laravel
  fetchOffers(query?: string) {
    this.offerService.loadOffers(query).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching offers:', err)
    });
  }

  get selectedFilterLabel(): string {
    return this.filterOptions.find((opt) => opt.value === this.selectedFilter)?.label || 'All';
  }

  // Mengubah filteredOffers agar mengambil data dari Signal this.offers()
  get filteredOffers() {
    const currentOffers = this.offers(); // Data ini sudah hasil filter dari Backend
    
    // Filter offers yang memiliki items
    let offersWithItems = currentOffers.filter(o => o.items && o.items.length > 0);
    
    // Jika kamu masih butuh filter kategori (Food/Other) secara instan di FE:
    if (this.selectedFilter !== 'all') {
      offersWithItems = offersWithItems.filter(o => 
        o.category.toLowerCase() === this.selectedFilter.toLowerCase()
      );
    }

    return offersWithItems;
  }

  initializeNotifications() {
    this.userNotifications = [
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
    ];
  }

  onCardClick(offerId: number) {
    this.router.navigate(['/offer', offerId]);
  }

  // Diperbarui agar memanggil API setiap kali user mencari
  onSearchChange(query: string) {
    this.searchQuery = query;
    this.fetchOffers(query);
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.cdr.markForCheck();
  }

  onFilterMenuOpened() {
    this.isFilterMenuOpen = true;
  }

  onFilterMenuClosed() {
    this.isFilterMenuOpen = false;
  }

  onMarkAllNotificationsRead() {
    this.userNotifications.forEach((n) => (n.read = true));
  }

  onMarkNotificationAsRead(notificationId: string) {
    const notification = this.userNotifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
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
      },
    );
  }

  private showLocationPickerDialog(coords?: GeolocationCoordinates) {
    const dialogRef = this.dialog.open(LocationPickerDialog, {
      width: '500px',
      data: { coords },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.location) {
        this.userLocation = result.location;
        this.userLocationCoordinates = result.coords || null;
        this.cdr.markForCheck();
      }
    });
  }

  openLocationInMaps(location: string) {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
    window.open(mapsUrl, '_blank');
  }

  openCurrentLocationInMaps() {
    if (this.userLocation !== 'Choose your location') {
      this.openLocationInMaps(this.userLocation);
    }
  }

  // Get price range for offer (min - max price from items)
  getPriceRange(offer: Offer): string {
    if (!offer.items || offer.items.length === 0) {
      return 'No Price';
    }

    const prices = offer.items.map(item => +item.item_price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `Rp ${minPrice.toLocaleString('id-ID')}`;
    }

    return `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
  }

  openCreateOffer() {
    this.router.navigate(['/offer/create']);
  }
}