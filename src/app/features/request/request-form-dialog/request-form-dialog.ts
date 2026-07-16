import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { form, FormField, required } from '@angular/forms/signals';
import { RequestService, RequestItem } from '../../../core/request.service';
import { DialogButton, DialogComponent } from '../../../shared/components/dialog/dialog';

export interface RequestFormDialogData {
  request?: RequestItem; 
  coords?: { lat: number; lng: number };
}

@Component({
  selector: 'app-request-form-dialog',
  standalone: true,
  imports: [
    DialogComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormField
  ],
  templateUrl: './request-form-dialog.html',
  styleUrls: ['./request-form-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestFormDialog {
  private readonly dialogRef = inject(MatDialogRef<RequestFormDialog>);
  private readonly data = inject<RequestFormDialogData>(MAT_DIALOG_DATA);
  private readonly requestService = inject(RequestService);
  private readonly snackBar = inject(MatSnackBar);

  readonly existingRequest = this.data.request;
  readonly isEditMode = !!this.existingRequest;
  readonly isSubmitting = signal(false);

  readonly model = signal({
    category: (this.existingRequest?.category as 'food' | 'other') ?? 'food',
    item_name: this.existingRequest?.item_name ?? '',
    arrival_date: this.existingRequest ? new Date(this.existingRequest.arrival_time) : new Date(),
    arrival_time_of_day: this.existingRequest ? this.toTimeOfDay(this.existingRequest.arrival_time) : '',
  });

  readonly form = form(this.model, (f) => {
    required(f.category, { message: 'Category is required' });
    required(f.item_name, { message: 'Name is required' });
    required(f.arrival_date, { message: 'Arrival date is required' });
  });

  readonly canSubmit = computed(() => !this.form().invalid());

  readonly buttons = computed<DialogButton[]>(() => {
    const btns: DialogButton[] = [];

    // Delete Button
    if (this.isEditMode) {
      btns.push({
        label: 'Delete',
        icon: 'delete',
        type: 'outlined',
        color: 'error', 
        disabled: this.isSubmitting(),
        action: () => this.deleteRequest()
      });
    }

    // Cancel Button
    btns.push({ 
      label: 'Cancel', 
      type: 'outlined', 
      action: () => this.dialogRef.close() 
    });

    // Create / Edit Button
    btns.push({
      label: this.isEditMode ? 'Edit Request' : 'Create Request',
      icon: !this.isEditMode ? 'check' : undefined,
      type: 'filled',
      color: 'primary',
      focus: true,
      disabled: !this.canSubmit() || this.isSubmitting(),
      action: () => this.submit()
    });

    return btns;
  });

  private toTimeOfDay(iso: string): string {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private combineDateTime(date: Date, timeOfDay: string): string {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours || 0, minutes || 0, 0, 0);
    return combined.toISOString();
  }

  deleteRequest() {
    if (!this.existingRequest) return;
    
    this.isSubmitting.set(true);
    this.requestService.deleteRequest(this.existingRequest.request_id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Request deleted successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackBar.open(err.error?.message || 'Failed to delete request.', 'Close', { duration: 3000 });
      }
    });
  }

  submit() {
    if (!this.canSubmit() || this.isSubmitting()) return;

    const m = this.model();
    const arrivalTime = this.combineDateTime(m.arrival_date, m.arrival_time_of_day);

    const payload = {
      category: m.category,
      item_name: m.item_name,
      arrival_time: arrivalTime,
      location_lat: this.data.coords?.lat ?? -6.2088,
      location_lng: this.data.coords?.lng ?? 106.8456,
    };

    this.isSubmitting.set(true);

    const request$ = this.isEditMode
      ? this.requestService.updateRequest(this.existingRequest!.request_id, payload)
      : this.requestService.createRequest(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const successMsg = this.isEditMode ? 'Request updated successfully' : 'Request published successfully';
        this.snackBar.open(successMsg, 'Close', { duration: 3000 });
        this.dialogRef.close(true); 
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackBar.open(err.error?.message || 'Failed to save request.', 'Close', { duration: 3000 });
      }
    });
  }
}