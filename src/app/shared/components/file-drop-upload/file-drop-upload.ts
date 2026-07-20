import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { inject } from '@angular/core';
import { ButtonSizeDirective } from '../../directives/button';
import { ImagePreviewDialog } from '../image-preview-dialog/image-preview-dialog';

/**
 * Drag-and-drop / browse image upload field. Shows the picked/existing
 * image as a thumbnail preview with a remove button — or, while `uploading`
 * is true, stays in its initial dropzone state regardless of whether a file
 * has been picked (pair it with `app-upload-file-card` to show progress).
 */
@Component({
  selector: 'app-file-drop-upload',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, ButtonSizeDirective],
  templateUrl: './file-drop-upload.html',
  styleUrls: ['./file-drop-upload.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileDropUpload {
  label = input<string>('Item image');
  accept = input<string>('.jpg,.jpeg,.png');
  maxSizeMb = input<number>(3);
  /** Existing image URL to preview (e.g. when editing), shown until a new file is picked. */
  existingUrl = input<string | null>(null);
  /** While true, always shows the dropzone rather than the preview, even if a file/existingUrl is set. */
  uploading = input(false, { transform: booleanAttribute });

  file = model<File | null>(null);

  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  previewUrl = computed(() => {
    if (this.uploading()) return null;
    const file = this.file();
    if (file) return URL.createObjectURL(file);
    return this.existingUrl();
  });

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0]);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.setFile(event.dataTransfer.files[0]);
    }
  }

  clear() {
    this.file.set(null);
  }

  private setFile(file: File) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open($localize`Invalid file type. Please upload .jpg, .jpeg, or .png file.`, $localize`Close`, {
        duration: 3000,
      });
      return;
    }

    const maxSize = this.maxSizeMb() * 1024 * 1024;
    if (file.size > maxSize) {
      this.snackBar.open(`File size too large. Maximum size is ${this.maxSizeMb()} MB.`, $localize`Close`, {
        duration: 3000,
      });
      return;
    }

    this.file.set(file);
  }

  openImagePreview() {
    const url = this.previewUrl();
    if (url) {
      this.dialog.open(ImagePreviewDialog, {
        width: '1600px',
        data: { imageUrl: url, title: this.label() },
        panelClass: 'image-preview-panel',
      });
    }
  }
}
