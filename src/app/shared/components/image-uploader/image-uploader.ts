import { Component, Input, Output, EventEmitter, ViewChild, TemplateRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

export interface ImageUploadEvent {
  file: File | null;
  url: string | null;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './image-uploader.html',
  styleUrls: ['./image-uploader.scss']
})
export class ImageUploaderComponent {
  @Input() imageUrl: string | null = null;
  @Input() height: string = '200px'; 
  @Input() editable: boolean = true; 

  @Output() imageChange = new EventEmitter<ImageUploadEvent>();

  private dialog = inject(MatDialog);
  @ViewChild('imagePreviewDialog') imagePreviewDialog!: TemplateRef<any>;
  
  previewDialogRef: any;
  isDragOver = signal<boolean>(false);

  // --- LOGIC HANDLING FILE INPUT ---
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) this.processFile(file);
    event.target.value = ''; 
  }

  // --- LOGIC DRAG & DROP ---
  onDragOver(event: DragEvent) {
    if (!this.editable || this.imageUrl) return;
    event.preventDefault(); event.stopPropagation(); this.isDragOver.set(true);
  }
  onDragLeave(event: DragEvent) {
    if (!this.editable || this.imageUrl) return;
    event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false);
  }
  onDrop(event: DragEvent) {
    if (!this.editable || this.imageUrl) return;
    event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.processFile(files[0]);
  }

  // --- PROSES VALIDASI & MEMBUAT PREVIEW ---
  private processFile(file: File) {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('Invalid file type! Only .jpg, .jpeg, .png are allowed.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('File is too large! Maximum size is 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imageChange.emit({ file: file, url: reader.result as string });
      if (this.previewDialogRef) this.previewDialogRef.close(); 
    };
    reader.readAsDataURL(file);
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.imageChange.emit({ file: null, url: null });
  }

  openPreview(event: Event) {
    if (!this.imageUrl) return;
    event.stopPropagation(); 

    this.previewDialogRef = this.dialog.open(this.imagePreviewDialog, {
      panelClass: 'bg-transparent',
      backdropClass: 'bg-black/80', 
    });
  }
}