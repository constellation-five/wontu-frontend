import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { OfferService, Offer } from '../../../core/offer.service';
import { PageHeaderService } from '../../../core/page-header.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { NaturalDateTimePipe } from '../../../shared/pipes/natural-date-time.pipe';
import { MainPageHeaderComponent } from '../../../shared/components/main-page-header/main-page-header';
import { LocationPickerDialog } from '../../../shared/components/location-picker-dialog/location-picker-dialog';
import { IconButtonVariantDirective } from '../../../shared/directives/button';
import { LocationLookupService } from '../../../core/location-lookup.service';
import { LocationStateService, DEFAULT_LOCATION } from '../../../core/location-state.service';
import { OngoingSection } from '../../../shared/components/ongoing-section/ongoing-section';

@Component({
  selector: 'offer-index',
  templateUrl: './offer-index-page.html',
  styleUrls: ['./offer-index-page.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    ProductCardComponent,
    NaturalDateTimePipe,
    MainPageHeaderComponent,
    IconButtonVariantDirective,
    OngoingSection,
    TitleCasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferShowPage {
  private readonly auth = inject(AuthService);
  private readonly offerService = inject(OfferService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly pageHeader = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly locationLookup = inject(LocationLookupService);
  private readonly locationState = inject(LocationStateService);

  readonly user = this.auth.user;
  readonly offers = this.offerService.allOffers;
  readonly isLoading = this.offerService.isLoading;
  readonly userLocation = this.locationState.userLocation;
  readonly userLocationCoordinates = this.locationState.userLocationCoordinates;

  searchQuery = signal<string>('');
  availableCategories = ['food', 'electronics', 'fashion', 'home', 'beauty', 'gaming', 'sports', 'other'];
  selectedCategories = signal<Set<string>>(new Set(this.availableCategories));

  filteredOffers = computed(() => {
    const allOffers = this.offers();
    const selected = this.selectedCategories();

    if (selected.size === 0) {
      return [];
    }

    if (selected.size === this.availableCategories.length) {
      return allOffers;
    }

    return allOffers.filter((offer) => selected.has(offer.category));
  });

  toggleCategory(category: string) {
    this.selectedCategories.update((current) => {
      const updated = new Set(current);
      if (updated.has(category)) {
        updated.delete(category);
      } else {
        updated.add(category);
      }
      return updated;
    });
  }

  ongoingOffers = computed(() => {
    const currentUserId = this.user()?.user_id;
    return this.filteredOffers().filter((offer) => offer.seller_id === currentUserId);
  });

  otherOffers = computed(() => {
    const currentUserId = this.user()?.user_id;
    return this.filteredOffers().filter((offer) => offer.seller_id !== currentUserId);
  });

  constructor() {
    this.pageHeader.setTitle($localize`Offers`);
    this.pageHeader.setBreadcrumbs([{ label: $localize`Offers`, route: '/offers' }]);

    if (!this.userLocationCoordinates()) {
      this.detectCurrentLocation();
    } else {
      this.fetchOffers(this.searchQuery());
    }
  }

  fetchOffers(query?: string) {
    this.offerService.loadOffers(query, this.userLocationCoordinates() ?? undefined).subscribe({
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

        this.cdr.markForCheck();
        this.fetchOffers(this.searchQuery());
      }
    });
  }

  private detectCurrentLocation(retriesLeft = 2) {
    if (!navigator.geolocation) {
      this.fetchOffers(this.searchQuery());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        this.applyDetectedLocation(coords);
      },
      (error) => {
        console.log('Geolocation error:', error);
        // POSITION_UNAVAILABLE (macOS CoreLocation's kCLErrorLocationUnknown) is usually
        // a transient hiccup right after permission is granted — retry a couple times.
        if (error.code === error.POSITION_UNAVAILABLE && retriesLeft > 0) {
          setTimeout(() => this.detectCurrentLocation(retriesLeft - 1), 2000);
        } else {
          this.fetchOffers(this.searchQuery());
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
    this.fetchOffers(this.searchQuery());

    try {
      this.userLocation.set(await this.locationLookup.resolvePlaceName(coords));
    } catch (err) {
      console.log('Location lookup error:', err);
      this.userLocation.set(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    }

    this.cdr.markForCheck();
  }

  openLocationInMaps(location: string) {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
    window.open(mapsUrl, '_blank');
  }

  openCurrentLocationInMaps() {
    if (this.userLocation() !== DEFAULT_LOCATION) {
      this.openLocationInMaps(this.userLocation());
    }
  }
}
