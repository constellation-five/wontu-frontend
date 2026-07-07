import { Injectable, inject } from '@angular/core';
import { GoogleMapsLoaderService } from './google-maps-loader.service';
import { buildShortAddress, fromGeocoderComponents, fromPlaceComponents } from './address-format';

// Prefer the place's name; only fall back to the address when there is no name.
export function formatPlaceLabel(name?: string | null, address?: string | null): string {
  return name || address || '';
}

@Injectable({
  providedIn: 'root',
})
export class LocationLookupService {
  private readonly mapsLoader = inject(GoogleMapsLoaderService);
  private geocoder?: google.maps.Geocoder;

  // Resolves coordinates to a human-readable place: prefers a nearby named
  // building/venue (Places API), falls back to a plain street address (Geocoding API).
  async resolvePlaceName(coords: google.maps.LatLngLiteral): Promise<string> {
    await this.mapsLoader.load();
    this.geocoder ??= new google.maps.Geocoder();

    try {
      const { places } = await google.maps.places.Place.searchNearby({
        fields: ['displayName', 'formattedAddress', 'addressComponents', 'userRatingCount'],
        locationRestriction: { center: coords, radius: 60 },
        rankPreference: google.maps.places.SearchNearbyRankPreference.DISTANCE,
        maxResultCount: 8,
      });

      // Results come back nearest-first. Among the handful of closest candidates,
      // prefer the most-reviewed one — a proxy for "the popular place here" —
      // rather than blindly picking the literal closest doorway.
      const best = places
        .slice(0, 5)
        .reduce<google.maps.places.Place | null>(
          (top, place) => ((place.userRatingCount ?? 0) > (top?.userRatingCount ?? 0) ? place : top),
          places[0] ?? null,
        );

      if (best?.displayName) {
        return best.displayName;
      }
      if (best?.formattedAddress) {
        return (
          buildShortAddress(fromPlaceComponents(best.addressComponents)) ?? best.formattedAddress
        );
      }
    } catch (err) {
      console.log('Places nearby search error:', err);
    }

    return this.reverseGeocode(coords);
  }

  private reverseGeocode(coords: google.maps.LatLngLiteral): Promise<string> {
    return new Promise((resolve, reject) => {
      this.geocoder!.geocode({ location: coords }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const short = buildShortAddress(fromGeocoderComponents(results[0].address_components));
          resolve(short ?? results[0].formatted_address);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }
}
