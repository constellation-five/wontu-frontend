import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'location-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './location-picker-dialog.html',
  styleUrls: ['./location-picker-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationPickerDialog {
  private readonly dialogRef = inject(MatDialogRef<LocationPickerDialog>);
  private readonly data = inject<{ coords?: GeolocationCoordinates }>(MAT_DIALOG_DATA);

  locationInput: string = '';
  hasCoordinates: boolean = false;
  locationHistory: string[] = [];
  private readonly STORAGE_KEY = 'wontu_location_history';
  private readonly MAX_HISTORY = 5;

  constructor() {
    this.hasCoordinates = !!this.data.coords;
    this.loadLocationHistory();
  }

  private loadLocationHistory() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.locationHistory = JSON.parse(stored);
      } catch (e) {
        this.locationHistory = [];
      }
    }
  }

  private saveLocationHistory() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.locationHistory));
  }

  useCurrentLocation() {
    if (!this.hasCoordinates || !this.data.coords) return;

    this.reverseGeocode(this.data.coords.latitude, this.data.coords.longitude);
  }

  private reverseGeocode(lat: number, lng: number) {
    // Gunakan Open Street Map Nominatim API (free, tidak perlu API key)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const locationName =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.road ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        this.locationInput = locationName;
      })
      .catch((error) => {
        console.log('Reverse geocode error:', error);
        this.locationInput = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      });
  }

  selectHistoryLocation(location: string) {
    this.locationInput = location;
    // Auto-confirm when selecting from history
    this.confirmLocation();
  }

  removeHistoryLocation(location: string) {
    this.locationHistory = this.locationHistory.filter((l) => l !== location);
    this.saveLocationHistory();
  }

  onLocationInputChange() {
    // Update history visibility
  }

  clearInput() {
    this.locationInput = '';
  }

  confirmLocation() {
    if (!this.locationInput.trim()) return;

    // Add to history if not already there
    const filtered = this.locationHistory.filter((l) => l !== this.locationInput);
    this.locationHistory = [this.locationInput, ...filtered].slice(0, this.MAX_HISTORY);
    this.saveLocationHistory();

    this.dialogRef.close({
      location: this.locationInput,
      coords: this.data.coords,
    });
  }

  onConfirm() {
    this.confirmLocation();
  }

  onCancel() {
    this.dialogRef.close();
  }
}
