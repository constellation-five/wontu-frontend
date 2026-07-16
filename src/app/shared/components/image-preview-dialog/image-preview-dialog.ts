import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ImagePreviewDialogData {
  imageUrl: string;
  title?: string;
}

/** Truncates the middle of a long name (e.g. "receipt_2026...february.jpg") rather than the end, keeping the extension visible. */
function truncateMiddle(value: string, maxLength = 40): string {
  if (value.length <= maxLength) return value;
  const headLength = Math.ceil((maxLength - 1) / 2);
  const tailLength = Math.floor((maxLength - 1) / 2);
  return `${value.slice(0, headLength)}…${value.slice(value.length - tailLength)}`;
}

@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="preview-header">
      <h2 mat-dialog-title class="preview-title">{{ truncatedTitle() }}</h2>
      <button matIconButton mat-dialog-close type="button">
        <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="preview-content">
      <img [src]="data.imageUrl" [alt]="data.title ?? 'Proof of payment'" />
    </mat-dialog-content>
  `,
  styles: [
    `
      .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: 8px;
      }
      .preview-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
      }
      .preview-content {
        display: flex;
        justify-content: center;
      }
      .preview-content img {
        max-width: 100%;
        max-height: 80vh;
        display: block;
        border-radius: var(--mat-sys-corner-medium);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewDialog {
  protected readonly data = inject<ImagePreviewDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ImagePreviewDialog>);

  protected readonly truncatedTitle = computed(() =>
    truncateMiddle(this.data.title ?? 'Preview'),
  );
}
