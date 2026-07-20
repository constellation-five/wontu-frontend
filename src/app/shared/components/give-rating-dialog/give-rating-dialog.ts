import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DialogButton, DialogComponent } from '../dialog/dialog';

export interface GiveRatingDialogData {
  merchantName: string;
}

@Component({
  selector: 'app-give-rating-dialog',
  standalone: true,
  imports: [DialogComponent, MatIconModule],
  templateUrl: './give-rating-dialog.html',
  styleUrl: './give-rating-dialog.scss',
})
export class GiveRatingDialog {
  private readonly dialogRef = inject(MatDialogRef<GiveRatingDialog>);
  readonly data = inject<GiveRatingDialogData>(MAT_DIALOG_DATA);

  readonly rating = signal(0);
  readonly hoverRating = signal(0);

  readonly buttons = computed<DialogButton[]>(() => [
    {
      label: 'Later',
      type: 'outlined',
      action: () => this.dialogRef.close('later'),
    },
    {
      label: 'Submit',
      type: 'filled',
      disabled: this.rating() === 0,
      action: () => this.dialogRef.close({ rating: this.rating() }),
    },
  ]);

  setRating(val: number) {
    this.rating.set(val);
  }

  setHover(val: number) {
    this.hoverRating.set(val);
  }
}
