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
import { LocationStateService } from '../../../core/location-state.service';

export interface RequestFormDialogData {
  request?: RequestItem; 
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
  host: {
    '[class.edit-mode]': 'isEditMode'
  }
})
export class RequestFormDialog {
  private readonly dialogRef = inject(MatDialogRef<RequestFormDialog>);
  private readonly data = inject<RequestFormDialogData>(MAT_DIALOG_DATA);
  private readonly requestService = inject(RequestService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly locationState = inject(LocationStateService);

  readonly existingRequest = this.data.request;
  readonly isEditMode = !!this.existingRequest;
  readonly dialogTitle = this.isEditMode ? $localize`Edit Request` : $localize`Create Request`;
  readonly isSubmitting = signal(false);

  readonly model = signal({
    category: (this.existingRequest?.category as string) ?? 'food',
    item_name: this.existingRequest?.item_name ?? '',
    arrival_date: this.existingRequest ? new Date(this.existingRequest.arrival_time) : new Date(),
    arrival_time_of_day: this.existingRequest ? this.toTimeOfDay(this.existingRequest.arrival_time) : '',
  });

  readonly form = form(this.model, (f) => {
    required(f.category, { message: $localize`Category is required` });
    required(f.item_name, { message: $localize`Name is required` });
    required(f.arrival_date, { message: $localize`Arrival date is required` });
  });

  readonly canSubmit = computed(() => !this.form().invalid());

  readonly buttons = computed<DialogButton[]>(() => {
    const btns: DialogButton[] = [];

    // Delete Button
    if (this.isEditMode) {
      btns.push({
        label: $localize`Delete`,
        icon: 'delete',
        type: 'outlined',
        color: 'error', 
        disabled: this.isSubmitting(),
        action: () => this.deleteRequest()
      });
    }

    // Cancel Button
    btns.push({ 
      label: $localize`Cancel`, 
      type: 'outlined', 
      action: () => this.dialogRef.close() 
    });

    // Create / Edit Button
    btns.push({
      label: this.isEditMode ? $localize`Edit Request` : $localize`Create Request`,
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

    const yyyy = combined.getFullYear();
    const mm = String(combined.getMonth() + 1).padStart(2, '0');
    const dd = String(combined.getDate()).padStart(2, '0');
    const hh = String(combined.getHours()).padStart(2, '0');
    const min = String(combined.getMinutes()).padStart(2, '0');
    const ss = '00';

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  deleteRequest() {
    if (!this.existingRequest) return;
    
    this.isSubmitting.set(true);
    this.requestService.deleteRequest(this.existingRequest.request_id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open($localize`Request deleted successfully`, $localize`Close`, { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackBar.open(err.error?.message || $localize`Failed to delete request.`, $localize`Close`, { duration: 3000 });
      }
    });
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  submit() {
    if (!this.canSubmit() || this.isSubmitting()) return;

    const m = this.model();
    const now = new Date();
    const arrivalDateOnly = this.startOfDay(m.arrival_date);
    const today = this.startOfDay(now);

    if (arrivalDateOnly.getTime() < today.getTime()) {
      this.snackBar.open($localize`Arrival date cannot be in the past.`, $localize`Close`, { duration: 3000 });
      return;
    }

    if (arrivalDateOnly.getTime() === today.getTime() && m.arrival_time_of_day) {
      const [hours, minutes] = m.arrival_time_of_day.split(':').map(Number);
      if (hours < now.getHours() || (hours === now.getHours() && minutes < now.getMinutes())) {
        this.snackBar.open($localize`Arrival time cannot be in the past.`, $localize`Close`, { duration: 3000 });
        return;
      }
    }

    const arrivalTime = this.combineDateTime(m.arrival_date, m.arrival_time_of_day);
    const currentUserCoords = this.locationState.userLocationCoordinates();

    if (!currentUserCoords) {
      this.snackBar.open($localize`Please set your location first before creating a request.`, $localize`Close`, { duration: 3000 });
      return;
    }

    const payload = {
      category: m.category,
      item_name: m.item_name,
      arrival_time: arrivalTime,
      location_lat: currentUserCoords.lat,
      location_lng: currentUserCoords.lng,
    };

    this.isSubmitting.set(true);

    const request$ = this.isEditMode
      ? this.requestService.updateRequest(this.existingRequest!.request_id, payload)
      : this.requestService.createRequest(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dialogRef.close(true); 
        const successMsg = this.isEditMode ? $localize`Request saved successfully.` : $localize`Request created successfully.`;
        this.snackBar.open(successMsg, $localize`Close`, { duration: 3000 });
      },
      error: (err) => {
        console.error('API Error:', err);
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open($localize`Failed to save request: ${msg}${status}`, $localize`Close`, { duration: 5000 });
      }
    });
  }
}