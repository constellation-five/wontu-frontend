import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DialogComponent } from '../../shared/components/dialog/dialog';
import { PaymentMethodCard } from '../../shared/components/payment-method-card/payment-method-card';
import { PaneComponent } from '../../shared/components/pane/pane';
import { PageHeaderService } from '../../core/page-header.service';
import { ButtonSizeDirective, ButtonColorDirective } from '../../shared/directives/button';

export interface PaymentMethodData {
  payment_method_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
}

@Component({
  selector: 'payment-method-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    CommonModule,
    MatDialogModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    PaymentMethodCard,
    PaneComponent,
    ButtonSizeDirective,
    ButtonColorDirective,
  ],
  templateUrl: './payment-method-page.html',
  styleUrl: './payment-method-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethod implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private pageHeader = inject(PageHeaderService);

  @ViewChild('methodDialog') methodDialog!: TemplateRef<any>;

  paymentMethods = signal<PaymentMethodData[]>([]);
  isLoading = signal(true);

  isEditMode = signal(false);
  selectedId = signal<number | null>(null);

  paymentForm = this.fb.group({
    bank_name: ['', [Validators.required]],
    account_name: ['', [Validators.required]],
    account_number: ['', [Validators.required]],
  });

  ngOnInit() {
    this.pageHeader.setTitle('Payment Methods');
    this.fetchPaymentMethods();
  }

  fetchPaymentMethods() {
    this.http.get<any>(`${environment.api}/payment-methods`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.paymentMethods.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.selectedId.set(null);
    this.paymentForm.reset();
    this.dialog.open(this.methodDialog, { width: '540px' });
  }

  openEditModal(method: PaymentMethodData) {
    this.isEditMode.set(true);
    this.selectedId.set(method.payment_method_id);
    this.paymentForm.patchValue({
      bank_name: method.bank_name,
      account_name: method.account_name,
      account_number: method.account_number,
    });
    this.dialog.open(this.methodDialog, { width: '540px' });
  }

  save() {
    if (this.paymentForm.invalid) return;
    const data = this.paymentForm.value;

    if (this.isEditMode()) {
      this.http
        .put(`${environment.api}/payment-methods/${this.selectedId()}`, data, {
          withCredentials: true,
        })
        .subscribe({
          next: () => {
            this.fetchPaymentMethods();
            this.dialog.closeAll();
          },
        });
    } else {
      this.http
        .post(`${environment.api}/payment-methods`, data, { withCredentials: true })
        .subscribe({
          next: () => {
            this.fetchPaymentMethods();
            this.dialog.closeAll();
          },
        });
    }
  }

  openDeleteConfirm() {
    this.dialog.closeAll();
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '540px',
      data: {
        title: 'Delete Payment Method',
        content:
          'Are you sure you want to delete this payment method?<br>This action cannot be undone.',
        buttons: [
          {
            label: 'Cancel',
            type: 'outlined',
            focus: true,
          },
          {
            label: 'Delete',
            icon: 'delete',
            type: 'filled',
            action: 'delete',
            color: 'error',
          },
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.confirmDelete();
      }
    });
  }

  confirmDelete() {
    this.http
      .delete(`${environment.api}/payment-methods/${this.selectedId()}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.fetchPaymentMethods();
          this.dialog.closeAll();
        },
      });
  }
}
