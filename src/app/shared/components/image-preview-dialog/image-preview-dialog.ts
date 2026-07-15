import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ImagePreviewDialogData {
  imageUrl: string;
  title?: string;
}

@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule],
  template: `
    <div class="image-preview-dialog">
      <button matIconButton mat-dialog-close class="close-btn">
        <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
      </button>
      <img [src]="data.imageUrl" [alt]="data.title ?? 'Proof of payment'" />
    </div>
  `,
  styles: [
    `
      .image-preview-dialog {
        position: relative;
        display: flex;
        justify-content: center;
      }
      .image-preview-dialog img {
        max-width: 100%;
        max-height: 80vh;
        display: block;
        border-radius: var(--mat-sys-corner-medium);
      }
      .close-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: var(--mat-sys-surface);
        z-index: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewDialog {
  protected readonly data = inject<ImagePreviewDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ImagePreviewDialog>);
}
