import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocationStateService {
  readonly userLocation = signal<string>('Choose your location');
  readonly userLocationCoordinates = signal<{ lat: number; lng: number } | null>(null);
  
  readonly isManuallySet = signal<boolean>(false); 
}