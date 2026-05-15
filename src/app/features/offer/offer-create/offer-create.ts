import { ChangeDetectionStrategy, Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

// --- MATERIAL IMPORTS ---
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker'; 
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// --- COMPONENTS & ENV ---
import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { environment } from '../../../../environments/environment';

export interface PaymentMethod {
  payment_method_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
}

@Component({
  selector: 'offer-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatTimepickerModule, 
    MatDialogModule, 
    PageHeaderComponent,
    PaneComponent
  ],
  templateUrl: './offer-create.html',
  styleUrls: ['./offer-create.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OfferCreate implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  @ViewChild('methodDialog') methodDialog!: TemplateRef<any>;

  isLoading = signal<boolean>(false);
  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Offers', route: '/offer' },
    { label: 'Create Offer' }
  ]);

  // --- STATE PAYMENT METHOD ---
  paymentMethods = signal<PaymentMethod[]>([]);
  isEditMode = signal(false); 

  // Pop-Up Modal
  paymentForm = this.fb.group({
    bank_name: ['', [Validators.required]],
    account_name: ['', [Validators.required]],
    account_number: ['', [Validators.required]],
  });

  // Main Form 
  offerForm: FormGroup = this.fb.group({
    category: ['', Validators.required],
    merchant_name: ['', Validators.required],
    closing_date: ['', Validators.required],
    closing_time: ['', Validators.required],
    arrival_date: ['', Validators.required],
    arrival_time: ['', Validators.required],
    
    has_cod_payment: [true], 
    selected_banks: this.fb.array([]) // Array untuk tampung ID bank yang diceklis
  });

  ngOnInit() {
    this.fetchPaymentMethods();
  }

  // --- LOGIC PAYMENT METHOD API ---
  fetchPaymentMethods() {
    this.http.get<any>(`${environment.api}/payment-methods`, { withCredentials: true }).subscribe({
      next: (res) => { 
        this.paymentMethods.set(res.data); 
      },
      error: (err) => console.error('Failed to fetch payment methods', err)
    });
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.paymentForm.reset();
    this.dialog.open(this.methodDialog, { width: '450px' });
  }

  saveNewPayment() {
    if (this.paymentForm.invalid) return;
    const data = this.paymentForm.value;

    this.http.post(`${environment.api}/payment-methods`, data, { withCredentials: true }).subscribe({
      next: () => { 
        this.fetchPaymentMethods();
        this.dialog.closeAll(); 
      },
      error: (err) => console.error('Failed to save payment method', err)
    });
  }

  // --- LOGIC CHECKBOX ---
  onBankToggle(event: any, methodId: number) {
    const banksFormArray = this.offerForm.get('selected_banks') as FormArray;
    if (event.target.checked) {
      banksFormArray.push(new FormControl(methodId)); // Masukkan ID kalau diceklis
    } else {
      const index = banksFormArray.controls.findIndex(x => x.value === methodId);
      if (index >= 0) banksFormArray.removeAt(index); // Buang ID kalau batal diceklis
    }
  }

  getBankInitials(name: string): string {
    if (!name) return '';
    if (name.toLowerCase().includes('central asia')) return 'BCA';
    if (name.toLowerCase().includes('negara indonesia')) return 'BNI';
    if (name.toLowerCase().includes('rakyat indonesia')) return 'BRI';
    if (name.toLowerCase().includes('mandiri')) return 'MDR';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 3);
  }

  onSubmit() {
    if (this.offerForm.valid) {
      console.log('Form Submitted', this.offerForm.value);
    } else {
      this.offerForm.markAllAsTouched();
    }
  }
}