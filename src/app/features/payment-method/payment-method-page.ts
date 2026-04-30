import { ChangeDetectionStrategy, Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatSelectModule } from '@angular/material/select'; 
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface PaymentMethod {
  payment_method_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
}

@Component({
  selector: 'payment-method-page',
  standalone: true,
  imports: [
    MatButtonModule, CommonModule, MatDialogModule, MatSelectModule, 
    MatInputModule, ReactiveFormsModule, MatIconModule
  ],
  templateUrl: './payment-method-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodPage implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  @ViewChild('methodDialog') methodDialog!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;

  paymentMethods = signal<PaymentMethod[]>([]);
  isLoading = signal(true);
  
  // State untuk kontrol Modal
  isEditMode = signal(false);
  selectedId = signal<number | null>(null);

  paymentForm = this.fb.group({
    bank_name: ['', [Validators.required]],
    account_name: ['', [Validators.required]],
    account_number: ['', [Validators.required]],
  });

  ngOnInit() { this.fetchPaymentMethods(); }

  fetchPaymentMethods() {
    this.http.get<any>(`${environment.api}/payment-methods`, { withCredentials: true }).subscribe({
      next: (res) => { 
        this.paymentMethods.set(res.data); 
        this.isLoading.set(false); 
      },
      error: () => this.isLoading.set(false)
    });
  }

  // Buka Modal Mode TAMBAH
  openAddModal() {
    this.isEditMode.set(false);
    this.selectedId.set(null);
    this.paymentForm.reset();
    this.dialog.open(this.methodDialog, { width: '450px' });
  }

  // Buka Modal Mode EDIT (Saat Card di Daftar diklik)
  openEditModal(method: PaymentMethod) {
    this.isEditMode.set(true);
    this.selectedId.set(method.payment_method_id);
    this.paymentForm.patchValue({
      bank_name: method.bank_name,
      account_name: method.account_name,
      account_number: method.account_number
    });
    this.dialog.open(this.methodDialog, { width: '450px' });
  }

  // Logic Simpan (POST jika Add, PUT jika Edit)
  save() {
    if (this.paymentForm.invalid) return;
    const data = this.paymentForm.value;

    if (this.isEditMode()) {
      this.http.put(`${environment.api}/payment-methods/${this.selectedId()}`, data, { withCredentials: true }).subscribe({
        next: () => { this.fetchPaymentMethods(); this.dialog.closeAll(); }
      });
    } else {
      this.http.post(`${environment.api}/payment-methods`, data, { withCredentials: true }).subscribe({
        next: () => { this.fetchPaymentMethods(); this.dialog.closeAll(); }
      });
    }
  }

  openDeleteConfirm() {
    this.dialog.closeAll();
    this.dialog.open(this.deleteConfirmDialog, { width: '400px' });
  }

  confirmDelete() {
    this.http.delete(`${environment.api}/payment-methods/${this.selectedId()}`, { withCredentials: true }).subscribe({
      next: () => { this.fetchPaymentMethods(); this.dialog.closeAll(); }
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Kamu bisa tambahkan snackbar atau alert kecil di sini
      console.log('Nomor rekening berhasil disalin!');
      alert('Copied to clipboard!'); 
    }).catch(err => {
      console.error('Gagal menyalin: ', err);
    });
  }
}