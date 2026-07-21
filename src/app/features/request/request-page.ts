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
import { AuthService } from '../../core/auth.service';
import { RequestService, RequestItem } from '../../core/request.service';
import { PageHeaderService } from '../../core/page-header.service';
import { RequestCard } from './request-card/request-card';
import { NaturalDateTimePipe } from '../../shared/pipes/natural-date-time.pipe';
import { MainPageHeaderComponent } from '../../shared/components/main-page-header/main-page-header';
import { LocationLookupService } from '../../core/location-lookup.service';
import { LocationStateService, DEFAULT_LOCATION } from '../../core/location-state.service';
import { LocationPickerDialog } from '../../shared/components/location-picker-dialog/location-picker-dialog';
import { RequestFormDialog } from './request-form-dialog/request-form-dialog';

@Component({
  selector: 'request-page',
  templateUrl: './request-page.html',
  styleUrl: './request-page.scss',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RequestCard,
    NaturalDateTimePipe,
    MainPageHeaderComponent,
    MatCheckboxModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestPage {
  private readonly auth = inject(AuthService);
  private readonly requestService = inject(RequestService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly pageHeader = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly locationLookup = inject(LocationLookupService);
  private readonly locationState = inject(LocationStateService);

  readonly user = this.auth.user;
  readonly requests = this.requestService.allRequests;
  readonly isLoading = this.requestService.isLoading;
  readonly userLocation = this.locationState.userLocation;
  readonly userLocationCoordinates = this.locationState.userLocationCoordinates;

  searchQuery = signal<string>('');
  filterFood = signal<boolean>(true);
  filterOther = signal<boolean>(true);

  // FILTER
  filteredRequests = computed(() => {
    const allReqs = this.requests();
    const food = this.filterFood();
    const other = this.filterOther();

    if (food && other) return allReqs;
    if (!food && !other) return [];

    return allReqs.filter((req) => {
      const category = req.category.toLowerCase();
      if (food && category === 'food') return true;
      if (other && category === 'other') return true;
      return false;
    });
  });

  // Ongoing Requests
  ongoingRequests = computed(() => {
    const currentUserId = this.user()?.user_id;
    return this.filteredRequests().filter(req => req.requester_id === currentUserId);
  });

  // Other Requests
  otherRequests = computed(() => {
    const currentUserId = this.user()?.user_id;
    return this.filteredRequests().filter(req => req.requester_id !== currentUserId);
  });

  constructor() {
    this.pageHeader.setTitle($localize`Requests`);
    this.pageHeader.setBreadcrumbs([{ label: $localize`Requests`, route: '/requests' }]);

    if (!this.userLocationCoordinates()) {
      this.detectCurrentLocation();
    } else {
      this.fetchRequests(this.searchQuery());
    }
  }

  fetchRequests(query?: string, silent = false) {
    this.requestService.loadRequests(query, this.userLocationCoordinates() ?? undefined, silent).subscribe({
      error: (err) => console.error('Error fetching requests:', err),
    });
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.fetchRequests(query);
  }

  // --- DIALOG CREATE REQUEST ---
  openCreateRequest() {
    if (!this.user()) {
      this.router.navigate(['/signin']);
      return;
    }

    const dialogRef = this.dialog.open(RequestFormDialog, {
      width: '500px',
      maxWidth: '95vw',
      data: { coords: this.userLocationCoordinates() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchRequests(this.searchQuery()); 
      }
    });
  }

  // --- CARD FUNCTION ---
  onEditRequest(req: RequestItem) {
    const dialogRef = this.dialog.open(RequestFormDialog, {
      width: '500px',
      maxWidth: '95vw',
      data: { 
        request: req, 
        coords: this.userLocationCoordinates() 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchRequests(this.searchQuery(), true); 
      }
    });
  }

  onCreateOffer(req: RequestItem) {
    if (!this.user()) {
      this.router.navigate(['/signin']);
      return;
    }
    this.router.navigate(['/offers/create'], { queryParams: { requestId: req.request_id } });
  }

  onVoteRequest(req: RequestItem) {
    if (!this.user()) {
      this.router.navigate(['/signin']); 
      return;
    }

    this.requestService.toggleVote(req.request_id).subscribe({
      next: () => {
        this.fetchRequests(this.searchQuery(), true); 
      },
      error: (err) => console.error('Failed to vote', err)
    });
  }

  // LOCATION
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
        this.fetchRequests(this.searchQuery());
      }
    });
  }

  private detectCurrentLocation(retriesLeft = 2) {
    if (!navigator.geolocation) {
      this.fetchRequests(this.searchQuery());
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
          this.fetchRequests(this.searchQuery());
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
    this.fetchRequests(this.searchQuery());

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
