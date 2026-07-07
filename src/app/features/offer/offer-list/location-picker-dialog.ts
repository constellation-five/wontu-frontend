import { AfterViewInit, Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GoogleMapsModule } from '@angular/google-maps';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { GoogleMapsLoaderService } from '../../../core/google-maps-loader.service';
import { LocationLookupService, formatPlaceLabel } from '../../../core/location-lookup.service';
import { buildShortAddress, fromPlaceComponents } from '../../../core/address-format';
import { ButtonSizeDirective, ButtonColorDirective } from '../../../shared/directives/button';

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: -6.2088, lng: 106.8456 }; // Jakarta fallback

interface SearchSuggestion {
  label: string;
  prediction: google.maps.places.PlacePrediction;
}

@Component({
  selector: 'location-picker-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDialogModule,
    GoogleMapsModule,
    ButtonSizeDirective,
    ButtonColorDirective,
  ],
  templateUrl: './location-picker-dialog.html',
  styleUrls: ['./location-picker-dialog.scss'],
})
export class LocationPickerDialog implements AfterViewInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  suggestions: SearchSuggestion[] = [];

  locationInput: string = '';
  hasCoordinates: boolean = false;
  isLocationVerified = false;
  isVerifying = false;
  verificationError: string | null = null;

  mapsLoading = true;
  mapsError: string | null = null;

  center: google.maps.LatLngLiteral = DEFAULT_CENTER;
  markerPosition: google.maps.LatLngLiteral = DEFAULT_CENTER;
  zoom = 16;
  readonly mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    clickableIcons: false,
    // Advanced markers require a Map ID. DEMO_MAP_ID works without any Cloud Console
    // setup; swap in a real Map ID there later for custom map styling.
    mapId: 'DEMO_MAP_ID',
  };

  // The user's real detected location (if known) — kept stable as a bias anchor
  // for autocomplete ranking, independent of wherever the pin/map is currently at.
  private readonly userCoords?: google.maps.LatLngLiteral;

  private sessionToken?: google.maps.places.AutocompleteSessionToken;
  private readonly subscriptions = new Subscription();

  constructor(
    private dialogRef: MatDialogRef<LocationPickerDialog>,
    private mapsLoader: GoogleMapsLoaderService,
    private locationLookup: LocationLookupService,
    @Inject(MAT_DIALOG_DATA) private data: { coords?: google.maps.LatLngLiteral; label?: string },
  ) {
    this.hasCoordinates = !!data.coords;
    this.userCoords = data.coords;
    if (data.coords) {
      this.center = data.coords;
      this.markerPosition = data.coords;
    }
    if (data.label) {
      this.setLocationText(data.label);
    }

    this.subscriptions.add(
      this.searchControl.valueChanges.subscribe((value) => {
        this.locationInput = value;
        // Typing invalidates whatever was previously verified — confirmLocation()
        // will re-verify this exact text against the Places/Geocoding API.
        this.isLocationVerified = false;
        this.verificationError = null;
      }),
    );
    this.subscriptions.add(
      this.searchControl.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((value) => this.fetchSuggestions(value)),
    );
  }

  async ngAfterViewInit() {
    try {
      await this.mapsLoader.load();
      this.mapsLoading = false;

      // Only auto-resolve a name from coordinates if we don't already have one —
      // re-running the nearby search here could surface a different nearby place
      // than the one already confirmed, silently overriding the user's choice.
      if (this.hasCoordinates && !this.locationInput) {
        this.lookupPlace(this.markerPosition);
      }
    } catch (err) {
      console.error('Google Maps failed to load:', err);
      this.mapsLoading = false;
      this.mapsError = 'Map unavailable right now — you can still type an address below.';
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private async fetchSuggestions(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      this.suggestions = [];
      return;
    }

    try {
      await this.mapsLoader.load();
      this.sessionToken ??= new google.maps.places.AutocompleteSessionToken();

      // Bias toward the user's real location (not wherever the pin/map happens to
      // be at the moment) so "distance" reflects distance from the user, per spec.
      const biasCenter = this.userCoords ?? this.center;

      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        sessionToken: this.sessionToken,
        origin: biasCenter,
        locationBias: { center: biasCenter, radius: 50000 },
      });

      // Google already returns suggestions ranked by relevance first; it has no
      // exposed numeric relevance score to blend with distance ourselves, so the
      // correct lever is feeding it the right bias/origin point rather than
      // re-sorting its output (which would just override relevance ordering).
      this.suggestions = suggestions
        .map((s) => s.placePrediction)
        .filter((p): p is google.maps.places.PlacePrediction => !!p)
        .map((prediction) => ({ label: prediction.text.text, prediction }));
    } catch (err) {
      console.log('Autocomplete suggestions error:', err);
      this.suggestions = [];
    }
  }

  async onOptionSelected(event: MatAutocompleteSelectedEvent) {
    const selected = this.suggestions.find((s) => s.label === event.option.value);
    this.suggestions = [];
    if (!selected) return;

    try {
      await this.applyPrediction(selected.prediction, selected.label);
    } finally {
      this.sessionToken = undefined;
    }
  }

  private async applyPrediction(prediction: google.maps.places.PlacePrediction, fallbackLabel: string) {
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'displayName', 'formattedAddress', 'addressComponents'],
      });

      if (place.location) {
        const coords = { lat: place.location.lat(), lng: place.location.lng() };
        this.center = coords;
        this.markerPosition = coords;
      }

      const address = place.displayName
        ? place.formattedAddress
        : (buildShortAddress(fromPlaceComponents(place.addressComponents)) ?? place.formattedAddress);

      this.setLocationText(formatPlaceLabel(place.displayName, address) || fallbackLabel);
    } catch (err) {
      console.log('Place details error:', err);
      this.setLocationText(fallbackLabel);
    }
  }

  onMapReady(map: google.maps.Map) {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'locate-me-control';

    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Use my current location';
    button.setAttribute('aria-label', 'Use my current location');
    button.innerHTML = '<span class="material-symbols-outlined">my_location</span>';
    button.addEventListener('click', () => this.useCurrentGpsLocation());

    controlDiv.appendChild(button);
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv);
  }

  private useCurrentGpsLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        this.hasCoordinates = true;
        this.center = coords;
        this.markerPosition = coords;
        this.lookupPlace(coords);
      },
      (error) => console.log('Geolocation error:', error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    this.markerPosition = coords;
    this.lookupPlace(coords);
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    this.markerPosition = coords;
    this.lookupPlace(coords);
  }

  private async lookupPlace(coords: google.maps.LatLngLiteral) {
    try {
      this.setLocationText(await this.locationLookup.resolvePlaceName(coords));
    } catch (err) {
      console.log('Location lookup error:', err);
      this.setLocationText(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    }
  }

  // Only called from trusted, already-real sources (a resolved place, a resolved
  // pin/GPS coordinate, or a previously-confirmed label) — never from raw typing.
  private setLocationText(text: string) {
    this.locationInput = text;
    this.suggestions = [];
    this.searchControl.setValue(text, { emitEvent: false });
    this.isLocationVerified = true;
    this.verificationError = null;
  }

  clearInput() {
    this.setLocationText('');
    this.isLocationVerified = false;
  }

  async confirmLocation() {
    const text = this.locationInput.trim();
    if (!text || this.isVerifying) return;

    if (this.isLocationVerified) {
      this.dialogRef.close({ location: text, coords: this.markerPosition });
      return;
    }

    // The user typed free text without picking a suggestion. Places Text Search /
    // Geocoding will happily fuzzy-match near-gibberish to some unrelated place, so
    // validation instead goes through the same Autocomplete Suggestions engine that
    // powers the dropdown — it returns nothing for input that isn't a real place.
    this.isVerifying = true;
    this.verificationError = null;

    try {
      const biasCenter = this.userCoords ?? this.center;
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: text,
        origin: biasCenter,
        locationBias: { center: biasCenter, radius: 50000 },
      });

      const prediction = suggestions.find((s) => s.placePrediction)?.placePrediction;
      if (!prediction) {
        this.verificationError = "We couldn't find that place. Try picking a suggestion from the list.";
        return;
      }

      // Having a real placeId-backed prediction is the actual validity gate here —
      // trust it the same way an explicit dropdown selection is trusted, even if
      // fetching full place details happens to fail (applyPrediction falls back
      // to the prediction's own text in that case).
      await this.applyPrediction(prediction, prediction.text.text);
      this.dialogRef.close({ location: this.locationInput, coords: this.markerPosition });
    } catch (err) {
      console.log('Location verification error:', err);
      this.verificationError = 'Something went wrong verifying that location. Please try again.';
    } finally {
      this.isVerifying = false;
    }
  }
}
