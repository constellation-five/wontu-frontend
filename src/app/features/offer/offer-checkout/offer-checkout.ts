import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageHeaderService } from '../../../core/page-header.service';
import { OfferService, Offer, CheckoutItem } from '../../../core/offer.service';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { OfferProgressComponent } from '../../../shared/components/offer-progress/offer-progress';
import { PaymentMethodCard, PaymentMethodData } from '../../../shared/components/payment-method-card/payment-method-card';
import { ButtonSizeDirective, ButtonColorDirective } from '../../../shared/directives/button';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-offer-checkout',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PaneComponent,
    OfferProgressComponent,
    PaymentMethodCard,
    ButtonSizeDirective,
    ButtonColorDirective,
  ],
  templateUrl: './offer-checkout.html',
  styleUrls: ['./offer-checkout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferCheckoutPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly offerService = inject(OfferService);
  private readonly dialog = inject(MatDialog);
  protected readonly pageHeader = inject(PageHeaderService);

  offer = signal<Offer | null>(null);
  checkoutItems = signal<CheckoutItem[]>([]);
  paymentMethods = signal<PaymentMethodData[]>([]);
  proofOfPayment = signal<File | null>(null);
  isLoading = signal(true);
  currentProgressStep = signal(0); // 0 = Offer joined

  totalItems = computed(() => 
    this.checkoutItems().reduce((sum, item) => sum + item.quantity, 0)
  );
  
  totalPrice = computed(() =>
    this.checkoutItems().reduce((sum, item) =>
      sum + (+item.item.item_price * item.quantity), 0
    )
  );

  isOfferClosed = computed(() => this.offer()?.is_completed ?? false);

  constructor() {
    const offerId = this.route.snapshot.paramMap.get('id');
    
    if (!offerId) {
      this.router.navigate(['/offers']);
      return;
    }
    
    // Get checkout items from history state (passed via router.navigate state)
    const state = history.state;
    
    console.log('Navigation state:', state);
    
    if (state && state['checkoutItems'] && Array.isArray(state['checkoutItems'])) {
      // New checkout from place order
      this.checkoutItems.set(state['checkoutItems']);
      this.offerService.setCheckoutState(+offerId, state['checkoutItems']);
      console.log('Loaded checkout items from navigation:', this.checkoutItems().length, 'items');
    } else {
      // Try to restore from service (e.g., when user clicks breadcrumb or from history)
      const savedItems = this.offerService.getCheckoutState(+offerId);
      if (savedItems && savedItems.length > 0) {
        this.checkoutItems.set(savedItems);
        console.log('Restored checkout items from service:', this.checkoutItems().length, 'items');
      } else {
        console.warn('No checkout items found. Redirecting to offer detail.');
        this.router.navigate(['/offers', offerId]);
        return;
      }
    }
    
    this.loadCheckoutData(offerId);
  }

  loadCheckoutData(id: string) {
    this.isLoading.set(true);
    
    // Load offer details
    this.offerService.getOfferById(id).subscribe({
      next: (offer) => {
        this.offer.set(offer);
        this.pageHeader.setBreadcrumbs([
          { label: 'Offers', route: '/offers' },
          { label: offer.merchant_name, route: `/offers/${id}` },
          { label: 'Checkout' },
        ]);
        
        this.loadPaymentMethods();
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offers']);
      },
    });
  }

  loadPaymentMethods() {
    // Load seller's payment methods
    const offerId = this.offer()?.offer_id;
    if (!offerId) return;

    this.http.get<any>(`${environment.api}/offers/${offerId}/payment-methods`, { 
      withCredentials: true 
    }).subscribe({
      next: (res) => {
        this.paymentMethods.set(res.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payment methods:', err);
        this.isLoading.set(false);
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload .jpg, .jpeg, or .png file.');
        return;
      }
      
      // Validate file size (max 3MB)
      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size too large. Maximum size is 3 MB.');
        return;
      }
      
      this.proofOfPayment.set(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload .jpg, .jpeg, or .png file.');
        return;
      }
      
      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size too large. Maximum size is 3 MB.');
        return;
      }
      
      this.proofOfPayment.set(file);
    }
  }

  completePayment() {
    // TODO: Implement payment completion with file upload
    console.log('Complete payment', this.proofOfPayment());
  }

  openCancelOrderDialog() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '540px',
      data: {
        title: 'Cancel Order',
        content: 'Are you sure you want to cancel this order?<br>This action cannot be undone and all items will be removed from your cart.',
        buttons: [
          {
            label: 'No, Keep Order',
            type: 'outlined',
            action: 'cancel'
          },
          {
            label: 'Yes, Cancel Order',
            icon: 'close',
            type: 'filled',
            action: 'confirm',
            bgColor: 'var(--mat-sys-error)',
            textColor: 'var(--mat-sys-on-error)'
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.cancelOrder();
      }
    });
  }

  cancelOrder() {
    const offer = this.offer();
    if (!offer) return;

    const items = this.checkoutItems().map(item => ({
      item_id: item.item.item_id,
      quantity: item.quantity,
    }));

    this.offerService.cancelOrder(offer.offer_id, items).subscribe({
      next: () => {
        // Clear cart from localStorage
        localStorage.removeItem(`cart_${offer.offer_id}`);
        
        // Clear history from localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`history_${offer.offer_id}_`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Removed ${keysToRemove.length} history entries for offer ${offer.offer_id}`);
        
        this.offerService.clearCheckoutState();
        this.router.navigate(['/offers']);
      },
      error: (err) => {
        console.error('Failed to cancel order:', err);
        alert('Failed to cancel order');
      },
    });
  }

  editOrder() {
    const offer = this.offer();
    if (!offer) return;

    // Check screen size
    const isMobile = window.innerWidth < 840;

    if (isMobile) {
      // Mobile: Navigate to mobile-cart page
      this.router.navigate(['/offers', offer.offer_id, 'mobile-cart'], {
        state: { 
          offer: offer,
          cart: this.checkoutItems().map(item => [item.item.item_id, item]),
          editMode: true,
          currentItems: this.checkoutItems()
        }
      });
    } else {
      // Desktop: Navigate to offer-detail page
      this.router.navigate(['/offers', offer.offer_id], {
        state: { 
          editMode: true,
          currentItems: this.checkoutItems()
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) +
      ', ' +
      date
        .toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        .replace('am', 'AM')
        .replace('pm', 'PM')
    );
  }

  openChat() {
    const offer = this.offer();
    if (!offer) return;

    this.router.navigate(['/offers', offer.offer_id, 'chat'], {
      state: { fromCheckout: true }
    });
  }
}
