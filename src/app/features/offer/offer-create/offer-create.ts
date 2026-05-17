import { ChangeDetectionStrategy, Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
import { BankLogoComponent } from '../../../shared/components/bank-logo/bank-logo';
import { DialogComponent, DialogData } from '../../../shared/components/dialog/dialog';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader';
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
    PaneComponent,
    BankLogoComponent,
    ImageUploaderComponent
  ],
  templateUrl: './offer-create.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferCreate implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  @ViewChild('methodDialog') methodDialog!: TemplateRef<any>;
  @ViewChild('itemDialog') itemDialog!: TemplateRef<any>;

  isLoading = signal<boolean>(false);
  minDate = new Date();
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
    closing_date: [new Date(), Validators.required],
    closing_time: [new Date(), Validators.required],
    arrival_date: [new Date(), Validators.required],
    arrival_time: [new Date(), Validators.required],
    
    has_cod_payment: [false], 
    selected_banks: this.fb.array([])
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
      banksFormArray.push(new FormControl(methodId));
    } else {
      const index = banksFormArray.controls.findIndex(x => x.value === methodId);
      if (index >= 0) banksFormArray.removeAt(index); 
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

  // --- STATE ITEMS & LOGIN ---
  itemList = signal<any[]>([]); 
  isSubmitting = signal<boolean>(false);

  // --- STATE UNTUK GAMBAR ITEM ---
  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  // --- STATE EDIT ITEM ---
  isEditItemMode = signal<boolean>(false);
  editItemId = signal<number | null>(null);

  // --- FORM ADD ITEM MODAL ---
  itemForm: FormGroup = this.fb.group({
    link: [''], // Optional
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    image: [null]
  });

  // --- LOGIC ITEM MODAL ---
  openAddItemModal() {
    this.isEditItemMode.set(false);
    this.editItemId.set(null);
    this.itemForm.reset({ price:0, quantity: 1 }); 
    this.imagePreview.set(null);
    this.selectedFile.set(null);
    this.dialog.open(this.itemDialog, { width: '500px', panelClass: 'rounded-3xl' });
  }

  updateFormQuantity(change: number) {
    const currentQty = this.itemForm.get('quantity')?.value || 1;
    const newQty = currentQty + change;
    if (newQty >= 1) {
      this.itemForm.patchValue({ quantity: newQty });
    }
  }

  onImageChange(event: { file: File | null; url: string | null }) {
    this.selectedFile.set(event.file);
    this.imagePreview.set(event.url);
  }

  saveNewItem() {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    
    const newItem = {
      id: Date.now(), 
      ...this.itemForm.value,
      imageFile: this.selectedFile(), // File asli untuk dikirim ke DB
      imageUrl: this.imagePreview()   // URL lokal untuk preview di Summary
    };

    this.itemList.update(items => [...items, newItem]);
    
    // Reset modal state setelah sukses nambah
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.dialog.closeAll();
  }

  // --- LOGIC SUMMARY LIST ---
  onUpdateQuantity(id: number, change: number) {
    const item = this.itemList().find(i => i.id === id);
    if (!item) return;

    const newQty = item.quantity + change;

    if (newQty === 0) {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '380px',
        panelClass: 'bg-transparent', // Biar box-shadow dari dialog.scss kamu kelihatan rapi
        data: {
          title: 'Remove Item',
          content: 'Setting the quantity to zero will remove this item from your cart.<br>Please confirm if you wish to proceed',
          buttons: [
            {
              label: 'Cancel',
              type: 'outlined',
              action: 'cancel'
            },
            {
              label: 'Delete',
              icon: 'delete',
              type: 'filled',
              action: 'delete',
              bgColor: 'var(--mat-sys-error)',
              textColor: 'var(--mat-sys-on-primary)'
            }
          ]
        } as DialogData
      });

      dialogRef.afterClosed().subscribe((action: string) => {
        if (action === 'delete') {
          this.onRemoveItem(id);
        }
      });

    } else if (newQty > 0) {
      this.itemList.update(items => 
        items.map(i => i.id === id ? { ...i, quantity: newQty } : i)
      );
    }
  }

  onRemoveItem(id: number) {
    this.itemList.update(items => items.filter(item => item.id !== id));
  }

  onEditItem(id: number) {
    const item = this.itemList().find(i => i.id === id);
    if (item) {
      this.isEditItemMode.set(true);
      this.editItemId.set(item.id);
      
      // Masukkan data ke form
      this.itemForm.patchValue({
        link: item.link || '',
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
      
      this.imagePreview.set(item.imageUrl || null);
      this.selectedFile.set(item.imageFile || null);
      
      this.dialog.open(this.itemDialog, { width: '500px', panelClass: 'rounded-3xl' });
    }
  }

  // Gabungan fungsi Add dan Edit saat klik Save/Confirm
  saveItem() {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    
    const formValue = this.itemForm.getRawValue();
    const currentImageFile = this.selectedFile();
    const currentImageUrl = this.imagePreview();

    if (this.isEditItemMode()) {
      // Logic Update Item
      this.itemList.update(items => items.map(item => {
        if (item.id === this.editItemId()) {
          return {
            ...item,
            ...formValue,
            imageFile: currentImageFile,
            imageUrl: currentImageUrl
          };
        }
        return item;
      }));
    } else {
      // Logic Add New Item
      const newItem = {
        id: Date.now(), 
        ...formValue,
        imageFile: currentImageFile,
        imageUrl: currentImageUrl
      };
      this.itemList.update(items => [...items, newItem]);
    }
    
    this.dialog.closeAll();
  }

  deleteItemFromModal() {
    const id = this.editItemId();
    if (!id) return;

    const dialogRef = this.dialog.open(DialogComponent, {
      width: '380px',
      panelClass: 'bg-transparent',
      data: {
        title: 'Remove Item',
        content: 'Are you sure you want to remove this item? This action cannot be undone.',
        buttons: [
          {
            label: 'Cancel',
            type: 'outlined',
            action: 'cancel'
          },
          {
            label: 'Delete',
            icon: 'delete',
            type: 'filled',
            action: 'delete',
            bgColor: 'var(--mat-sys-error)',
            textColor: 'var(--mat-sys-on-primary)'
          }
        ]
      } as DialogData
    });

    dialogRef.afterClosed().subscribe((action: string) => {
      if (action === 'delete') {
        this.onRemoveItem(id);
        this.dialog.closeAll();
      }
    });
  }

  onSubmit() {
    if (this.offerForm.valid && this.itemList().length > 0) {
      this.isSubmitting.set(true);

      const formValues = this.offerForm.value;

      const formatDateTime = (dateObj: Date, timeObj: Date) => {
        const d = new Date(dateObj);
        d.setHours(timeObj.getHours(), timeObj.getMinutes(), 0);
        const offset = d.getTimezoneOffset() * 60000;
        return (new Date(d.getTime() - offset)).toISOString().slice(0, 19).replace('T', ' ');
      };

      const payload = {
        category: formValues.category,
        merchant_name: formValues.merchant_name,
        closing_time: formatDateTime(formValues.closing_date, formValues.closing_time),
        arrival_time: formatDateTime(formValues.arrival_date, formValues.arrival_time),
        has_cod_payment: formValues.has_cod_payment,
        
        items: this.itemList().map(item => ({
          item_name: item.name,
          item_price: item.price,
          slot: item.quantity,
          current_slot: 0,
          item_url: item.link || null,
          image_url: null
        }))
      };

      this.http.post(`${environment.api}/offers`, payload, { withCredentials: true }).subscribe({
        next: (response) => {
          console.log('Berhasil disimpan ke DB!', response);
          this.isSubmitting.set(false);
          this.router.navigate(['/offer']);
        },
        error: (err) => {
          console.error('Gagal menyimpan offer', err);
          this.isSubmitting.set(false);
        }
      });

    } else {
      this.offerForm.markAllAsTouched();
    }
  }
}