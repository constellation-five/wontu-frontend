import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { IconButtonVariantDirective } from '../../directives/button/icon-button-variant';
import { ImagePreviewDialog } from '../image-preview-dialog/image-preview-dialog';

/** Shows KB below 1 MB (otherwise small files — e.g. a 40 KB screenshot — would round to "0.0MB"). */
function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  if (mb < 1) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }
  return `${mb.toFixed(1)}MB`;
}

/** Last URL path segment, decoded — used as a filename when only a remote URL is known (no local File). */
function nameFromUrl(url: string): string {
  try {
    const segments = new URL(url).pathname.split('/');
    return decodeURIComponent(segments[segments.length - 1] || url);
  } catch {
    return url;
  }
}

/**
 * A file card showing name + size, with an upload progress bar while
 * `uploadProgress` is a number (0-100) — once it's null, the progress bar
 * is replaced by just the total file size and an eye button appears to
 * preview the image. Used for proof-of-payment (persists after upload
 * finishes, and across reloads via `remoteUrl` once submitted) and the
 * Add/Edit Item dialog's image (shown only while uploading, alongside
 * `app-file-drop-upload`).
 *
 * Provide either `file` (a freshly-picked local File, with live progress) or
 * `remoteUrl` (an already-uploaded file with no in-memory File object, e.g.
 * restored from the database after a page reload) — not both.
 */
@Component({
  selector: 'app-upload-file-card',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressBarModule, IconButtonVariantDirective],
  templateUrl: './upload-file-card.html',
  styleUrls: ['./upload-file-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFileCard {
  private readonly dialog = inject(MatDialog);

  file = input<File | null>(null);
  remoteUrl = input<string | null>(null);
  /** 0-100 while uploading; null once finished (always null for remoteUrl-only cards). */
  uploadProgress = input<number | null>(null);

  readonly isFinished = computed(() => this.uploadProgress() === null);

  readonly fileName = computed(() => {
    const file = this.file();
    if (file) return file.name;
    const url = this.remoteUrl();
    return url ? nameFromUrl(url) : '';
  });

  private readonly previewUrl = computed(() => {
    const file = this.file();
    return file ? URL.createObjectURL(file) : this.remoteUrl();
  });

  readonly totalSizeLabel = computed(() => {
    const file = this.file();
    return file ? formatFileSize(file.size) : null;
  });

  readonly uploadedSizeLabel = computed(() => {
    const file = this.file();
    const progress = this.uploadProgress();
    if (!file || progress === null) return null;
    return `${formatFileSize((file.size * progress) / 100)} of ${this.totalSizeLabel()}`;
  });

  openPreview() {
    const imageUrl = this.previewUrl();
    if (!imageUrl) return;
    this.dialog.open(ImagePreviewDialog, {
      width: '1600px',
      data: { imageUrl, title: this.fileName() },
    });
  }
}
