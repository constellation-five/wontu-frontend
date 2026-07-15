import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpEventType } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TemplatePortal } from '@angular/cdk/portal';
import { form, FormField, required } from '@angular/forms/signals';
import { CounterField } from '../../../../shared/components/counter-field/counter-field';
import { FileDropUpload } from '../../../../shared/components/file-drop-upload/file-drop-upload';
import { UploadFileCard } from '../../../../shared/components/upload-file-card/upload-file-card';
import { DialogComponent } from '../../../../shared/components/dialog/dialog';
import { ButtonSizeDirective, ButtonColorDirective } from '../../../../shared/directives/button';
import { BottomBarService } from '../../../../core/bottom-bar.service';
import { RESPONSIVE_DIALOG_CONTEXT } from '../../../../shared/components/responsive-dialog/responsive-dialog-context';
import { OfferService, OfferItemInput } from '../../../../core/offer.service';

export interface AddEditItemDialogData {
  item: (OfferItemInput & { localId: string }) | null;
}

export type AddEditItemDialogResult = (OfferItemInput & { localId: string }) | { deleted: true; localId: string };

@Component({
  selector: 'app-add-edit-item-dialog',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormField,
    CounterField,
    FileDropUpload,
    UploadFileCard,
    ButtonSizeDirective,
    ButtonColorDirective,
  ],
  templateUrl: './add-edit-item-dialog.html',
  styleUrls: ['./add-edit-item-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditItemDialog implements AfterViewInit, OnDestroy {
  private readonly data = inject<AddEditItemDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AddEditItemDialog, AddEditItemDialogResult>);
  private readonly dialog = inject(MatDialog);
  private readonly offerService = inject(OfferService);
  private readonly bottomBarService = inject(BottomBarService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly dialogContext = inject(RESPONSIVE_DIALOG_CONTEXT, { optional: true });

  @ViewChild('actionsTpl') private actionsTpl!: TemplateRef<unknown>;

  readonly isEdit = !!this.data.item;
  readonly localId = this.data.item?.localId ?? crypto.randomUUID();
  readonly uploadProgress = signal<number | null>(null);
  readonly isUploading = computed(() => this.uploadProgress() !== null);
  readonly file = signal<File | null>(null);
  private uploadedImageUrl = signal<string | null>(null);

  readonly model = signal({
    item_url: this.data.item?.item_url ?? '',
    item_name: this.data.item?.item_name ?? '',
    item_price: this.data.item?.item_price ?? 0,
  });

  readonly slot = signal(this.data.item?.slot ?? 1);

  readonly existingImageUrl = this.data.item?.image_url ?? null;

  readonly form = form(this.model, (f) => {
    required(f.item_name, { message: 'Item name is required' });
    required(f.item_price, { message: 'Price is required' });
  });

  private ownPortal: TemplatePortal | null = null;

  ngAfterViewInit() {
    if (this.dialogContext?.isMobile()) {
      this.ownPortal = new TemplatePortal(this.actionsTpl, this.viewContainerRef);
      this.bottomBarService.push(this.ownPortal);
    }
  }

  ngOnDestroy() {
    if (this.ownPortal) {
      this.bottomBarService.pop(this.ownPortal);
    }
  }

  close() {
    this.dialogRef.close();
  }

  onFileChange(file: File | null) {
    this.file.set(file);
    this.uploadedImageUrl.set(null);

    if (!file) {
      this.uploadProgress.set(null);
      return;
    }

    this.uploadProgress.set(0);
    this.offerService.uploadImageWithProgress(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgress.set(null);
          this.uploadedImageUrl.set(event.body?.url ?? null);
        }
      },
      error: () => {
        this.uploadProgress.set(null);
        this.file.set(null);
      },
    });
  }

  submit() {
    if (this.form().invalid() || this.isUploading()) return;

    const m = this.model();
    this.dialogRef.close({
      localId: this.localId,
      item_id: this.data.item?.item_id,
      item_name: m.item_name,
      item_price: +m.item_price,
      item_url: m.item_url || null,
      slot: this.slot(),
      image_url: this.uploadedImageUrl() ?? this.existingImageUrl,
    });
  }

  openDeleteConfirm() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '540px',
      data: {
        title: 'Delete Item',
        content: 'Are you sure you want to delete this item?',
        buttons: [
          { label: 'Cancel', type: 'outlined', focus: true },
          { label: 'Delete', icon: 'delete', type: 'filled', action: 'delete', color: 'error' },
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.dialogRef.close({ deleted: true, localId: this.localId });
      }
    });
  }
}
