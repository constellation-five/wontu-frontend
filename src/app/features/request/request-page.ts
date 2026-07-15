import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MainPageHeaderComponent } from '../../shared/components/main-page-header/main-page-header';
import { LocationPickerDialog } from '../../shared/components/location-picker-dialog/location-picker-dialog';
import { LocationStateService } from '../../core/location-state.service';

@Component({
  selector: 'request-page',
  templateUrl: './request-page.html',
  styleUrl: './request-page.scss',
  imports: [MatIconModule, MatButtonModule, MatMenuModule, MainPageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestPage {
  private readonly dialog = inject(MatDialog);
  private readonly locationState = inject(LocationStateService);

  readonly userLocation = this.locationState.userLocation;
  readonly userLocationCoordinates = this.locationState.userLocationCoordinates;

  searchQuery = signal<string>('');

  onChangeLocation() {
    const dialogRef = this.dialog.open(LocationPickerDialog, {
      width: '500px',
      data: {
        coords: this.userLocationCoordinates() ?? undefined,
        label: this.userLocation() !== 'Choose your location' ? this.userLocation() : undefined,
      },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.location) {
        this.locationState.isManuallySet.set(true);
        this.userLocation.set(result.location);
        this.userLocationCoordinates.set(result.coords ?? null);
      }
    });
  }
}
