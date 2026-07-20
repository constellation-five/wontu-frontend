import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { ButtonSizeDirective, ButtonColorDirective } from '../../directives/button';
import { DialogComponent } from '../dialog/dialog';
import { PaymentMethodData } from '../payment-method-card/payment-method-card';

export interface PaymentMethodFormDialogData {
  method?: PaymentMethodData;
}

/**
 * The "Add/Edit Payment Method" dialog — bank select, account name/number
 * fields, Cancel + Add Method/Confirm (+ Delete in edit mode). Shared by the
 * Payment Methods profile page and the Create Offer page's payment method
 * selection, so both trigger the exact same dialog. Closes with the
 * created/updated PaymentMethodData on success, or undefined on cancel.
 */
@Component({
  selector: 'app-payment-method-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    ButtonSizeDirective,
    ButtonColorDirective,
  ],
  templateUrl: './payment-method-form-dialog.html',
  styleUrls: ['./payment-method-form-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodFormDialog {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(
    MatDialogRef<PaymentMethodFormDialog, PaymentMethodData | 'deleted'>,
  );
  private readonly data = inject<PaymentMethodFormDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly isEditMode = !!this.data?.method;
  readonly isSaving = signal(false);

  readonly form = this.fb.group({
    bank_name: [this.data?.method?.bank_name ?? '', [Validators.required]],
    account_name: [this.data?.method?.account_name ?? '', [Validators.required]],
    account_number: [
      this.data?.method?.account_number ?? '',
      [Validators.required, Validators.pattern(/^\d+$/)],
    ],
  });

  save() {
    if (this.form.invalid || this.isSaving()) return;
    this.isSaving.set(true);
    const data = this.form.value;

    const request$ = this.isEditMode
      ? this.http.put<{ data: PaymentMethodData }>(
          `${environment.api}/payment-methods/${this.data!.method!.payment_method_id}`,
          data,
          { withCredentials: true },
        )
      : this.http.post<{ data: PaymentMethodData }>(`${environment.api}/payment-methods`, data, {
          withCredentials: true,
        });

    request$.subscribe({
      next: (res) => {
        this.snackBar.open($localize`Payment method saved successfully.`, $localize`Close`, { duration: 3000 });
        this.isSaving.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open($localize`Failed to save payment method: ${msg}${status}`, $localize`Close`, { duration: 5000 });
        this.isSaving.set(false);
      },
    });
  }

  openDeleteConfirm() {
    const method = this.data?.method;
    if (!method) return;

    const confirmRef = this.dialog.open(DialogComponent, {
      width: '540px',
      data: {
        title: $localize`Delete Payment Method`,
        content: $localize`Are you sure you want to delete this payment method?<br>This action cannot be undone.`,
        buttons: [
          { label: $localize`Cancel`, type: 'outlined', focus: true },
          { label: $localize`Delete`, icon: 'delete', type: 'filled', action: 'delete', color: 'error' },
        ],
      },
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.confirmDelete(method.payment_method_id);
      }
    });
  }

  private confirmDelete(id: number) {
    this.http.delete(`${environment.api}/payment-methods/${id}`, { withCredentials: true }).subscribe({
      next: () => {
        this.snackBar.open($localize`Payment method deleted successfully.`, $localize`Close`, { duration: 3000 });
        this.dialogRef.close('deleted');
      },
      error: (err) => {
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open($localize`Failed to delete payment method: ${msg}${status}`, $localize`Close`, { duration: 5000 });
      },
    });
  }
}
