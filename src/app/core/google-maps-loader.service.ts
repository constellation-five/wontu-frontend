import { Injectable } from '@angular/core';

declare global {
  interface Window {
    __googleMapsLoaderCallback?: () => void;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (typeof google !== 'undefined' && google.maps) {
      return Promise.resolve();
    }

    if (!this.loadPromise) {
      this.loadPromise = new Promise<void>((resolve, reject) => {
        const apiKey = window.__env?.googleMapsApiKey;
        if (!apiKey) {
          reject(new Error('Google Maps API key is not configured (src/assets/env-config.js).'));
          return;
        }

        window.__googleMapsLoaderCallback = () => resolve();

        const script = document.createElement('script');
        script.src =
          `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
          '&libraries=places,marker&callback=__googleMapsLoaderCallback&loading=async';
        script.async = true;
        script.onerror = () => reject(new Error('Failed to load the Google Maps script.'));
        document.head.appendChild(script);
      });
    }

    return this.loadPromise;
  }
}
