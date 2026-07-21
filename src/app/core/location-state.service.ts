import { Injectable, signal } from '@angular/core';

export const DEFAULT_LOCATION = $localize`Choose your location`;

@Injectable({
  providedIn: 'root',
})
export class LocationStateService {
  readonly userLocation = signal<string>(DEFAULT_LOCATION);
  readonly userLocationCoordinates = signal<{ lat: number; lng: number } | null>(null);
  
  readonly isManuallySet = signal<boolean>(false); 
}