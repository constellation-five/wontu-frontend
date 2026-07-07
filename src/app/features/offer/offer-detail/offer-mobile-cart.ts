import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { PageHeaderService } from '../../../core/page-header.service';
import { Offer, CheckoutItem, OfferService } from '../../../core/offer.service';
import { ButtonSizeDirective } from '../../../shared/directives/button';
import { IconButtonVariantDirective } from '../../../shared/directives/button/icon-button-variant';
import { EditNotesDialog } from './edit-notes-dialog';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-offer-mobile-cart',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    PaneComponent,
    ButtonSizeDirective,
    IconButtonVariantDirective,
    DecimalPipe,
  ],
  templateUrl: './offer-mobile-cart.html',
  styleUrls: ['./offer-mobile-cart.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferMobileCart {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeader = inject(PageHeaderService);
  private readonly offerService = inject(OfferService);

  offer = signal<Offer | null>(null);
  cart = signal<Map<number, CheckoutItem>>(new Map());
  isLoading = signal(true);

  cartItems = computed(() => Array.from(this.cart().values()));
  totalItems = computed(() => 
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );
  totalPrice = computed(() => 
    this.cartItems().reduce((sum, item) => 
      sum + (+item.item.item_price * item.quantity), 0
    )
  );

  private selectedItemForRemoval = signal<CheckoutItem | null>(null);

  constructor() {
    const offerId = this.route.snapshot.paramMap.get('id');
    const state = history.state;

    if (state && state['offer'] && state['cart']) {
      this.offer.set(state['offer']);
      const cartMap = new Map<number, CheckoutItem>(state['cart']);
      this.cart.set(cartMap);
      this.isLoading.set(false);
    } else if (offerId) {
      // Direct navigation, refresh, or back/forward: no history.state to restore from.
      this.loadCartFromLocalStorage(offerId);
      this.loadOffer(offerId);
    } else {
      this.router.navigate(['/offers']);
      return;
    }

    this.pageHeader.setTitle('Cart');
    this.pageHeader.setBreadcrumbs([
      { label: 'Offers', route: '/offers' },
      { label: this.offer()?.merchant_name || 'Offer', route: `/offers/${this.offer()?.offer_id}` },
      { label: 'Cart' },
    ]);

    // Auto-redirect to offer-detail when resizing to desktop
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize.bind(this));
      this.checkScreenSize();
    }
  }

  private loadOffer(id: string) {
    this.isLoading.set(true);
    this.offerService.getOfferById(id).subscribe({
      next: (offer) => {
        this.offer.set(offer);
        this.pageHeader.setTitle(offer.merchant_name);
        this.pageHeader.setBreadcrumbs([
          { label: 'Offers', route: '/offers' },
          { label: offer.merchant_name, route: `/offers/${offer.offer_id}` },
          { label: 'Cart' },
        ]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offers']);
      },
    });
  }

  private loadCartFromLocalStorage(offerId: string) {
    const saved = localStorage.getItem(`cart_${offerId}`);
    if (saved) {
      try {
        const cartData = JSON.parse(saved);
        this.cart.set(new Map<number, CheckoutItem>(cartData));
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }
    }
  }

  private handleResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const isDesktop = window.innerWidth >= 840;
    if (isDesktop) {
      const offer = this.offer();
      if (offer) {
        this.router.navigate(['/offers', offer.offer_id], {
          state: {
            cart: Array.from(this.cart().entries())
          }
        });
      }
    }
  }

  private saveCartToLocalStorage(offerId: number) {
    const cartData = Array.from(this.cart().entries());
    localStorage.setItem(`cart_${offerId}`, JSON.stringify(cartData));
  }

  private clearCartFromLocalStorage(offerId: number) {
    localStorage.removeItem(`cart_${offerId}`);
  }

  goBack() {
    const offer = this.offer();
    if (!offer) {
      this.router.navigate(['/offers']);
      return;
    }

    this.router.navigate(['/offers', offer.offer_id], {
      state: {
        cart: Array.from(this.cart().entries())
      }
    });
  }

  onIncreaseQuantity(itemId: number) {
    const currentCart = new Map(this.cart());
    const item = currentCart.get(itemId);
    
    if (item) {
      const stockRemaining = item.item.slot - item.item.current_slot;
      if (item.quantity < stockRemaining) {
        item.quantity += 1;
        this.cart.set(currentCart);
        const offer = this.offer();
        if (offer) {
          this.saveCartToLocalStorage(offer.offer_id);
        }
      }
    }
  }

  onDecreaseQuantity(itemId: number) {
    const currentCart = new Map(this.cart());
    const item = currentCart.get(itemId);
    
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
        this.cart.set(currentCart);
        const offer = this.offer();
        if (offer) {
          this.saveCartToLocalStorage(offer.offer_id);
        }
      } else {
        this.selectedItemForRemoval.set(item);
        this.openRemoveConfirm(item);
      }
    }
  }

  editCartItemNotes(cartItem: CheckoutItem) {
    const dialogRef = this.dialog.open(EditNotesDialog, {
      width: '400px',
      data: { notes: cartItem.notes || '' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        const currentCart = new Map(this.cart());
        const item = currentCart.get(cartItem.item.item_id);
        if (item) {
          item.notes = result;
          this.cart.set(currentCart);
          const offer = this.offer();
          if (offer) {
            this.saveCartToLocalStorage(offer.offer_id);
          }
        }
      }
    });
  }

  isCartItemMaxQuantity(cartItem: CheckoutItem): boolean {
    const stockRemaining = cartItem.item.slot - cartItem.item.current_slot;
    return cartItem.quantity >= stockRemaining;
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

  onPlaceOrder() {
    const offer = this.offer();
    if (!offer || this.totalItems() === 0) return;

    const items = this.cartItems().map(cartItem => ({
      item_id: cartItem.item.item_id,
      quantity: cartItem.quantity,
    }));

    // Check if this is edit mode
    const state = history.state;
    const isEditMode = state && state['editMode'] && state['currentItems'];

    if (isEditMode) {
      // Use replaceOrder API for edit mode
      const oldItems = state['currentItems'].map((item: any) => ({
        item_id: item.item.item_id,
        quantity: item.quantity,
      }));

      console.log('Edit mode: replacing order', { oldItems, newItems: items });

      this.offerService.replaceOrder(offer.offer_id, oldItems, items).subscribe({
        next: () => {
          // Update existing history (not create new)
          this.updateOrderHistory(offer.offer_id, offer.merchant_name);
          this.clearCartFromLocalStorage(offer.offer_id);
          
          this.router.navigate(['/offers', offer.offer_id, 'checkout'], {
            state: {
              checkoutItems: this.cartItems()
            }
          });
        },
        error: (err) => {
          console.error('Failed to replace order:', err);
          alert('Failed to update order. Please try again.');
        },
      });
    } else {
      // Normal place order
      this.offerService.placeOrder(offer.offer_id, items).subscribe({
        next: () => {
          // Save to history and clear cart
          this.saveOrderToHistory(offer.offer_id, offer.merchant_name);
          this.clearCartFromLocalStorage(offer.offer_id);
          
          this.router.navigate(['/offers', offer.offer_id, 'checkout'], {
            state: {
              checkoutItems: this.cartItems()
            }
          });
        },
        error: (err) => {
          console.error('Failed to place order:', err);
          alert('Failed to place order. Please try again.');
        },
      });
    }
  }

  private saveOrderToHistory(offerId: number, merchantName: string) {
    const historyKey = `history_${offerId}_${Date.now()}`;
    const orderData = {
      offerId,
      merchantName,
      items: this.cartItems(),
      orderDate: new Date().toISOString(),
      status: 'placed',
    };
    localStorage.setItem(historyKey, JSON.stringify(orderData));
    console.log('Order saved to history:', historyKey);
  }

  private updateOrderHistory(offerId: number, merchantName: string) {
    // Find existing history entry for this offer
    let existingHistoryKey: string | null = null;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`history_${offerId}_`)) {
        existingHistoryKey = key;
        break;
      }
    }

    if (existingHistoryKey) {
      // Update existing history
      const existingData = localStorage.getItem(existingHistoryKey);
      if (existingData) {
        try {
          const orderData = JSON.parse(existingData);
          // Keep original orderDate and timestamp, only update items
          orderData.items = this.cartItems();
          orderData.merchantName = merchantName;
          localStorage.setItem(existingHistoryKey, JSON.stringify(orderData));
          console.log('Order history updated:', existingHistoryKey);
        } catch (e) {
          console.error('Error updating history:', e);
        }
      }
    } else {
      // No existing history found, create new one (fallback)
      console.warn('No existing history found for edit mode, creating new entry');
      this.saveOrderToHistory(offerId, merchantName);
    }
  }

  openRemoveConfirm(cartItem: CheckoutItem) {
    this.dialog.closeAll();
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '540px',
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
            textColor: 'var(--mat-sys-on-error)'
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.confirmRemoveItem();
      }
      this.selectedItemForRemoval.set(null);
    });
  }

  confirmRemoveItem() {
    const item = this.selectedItemForRemoval();
    if (!item) return;

    const currentCart = new Map(this.cart());
    currentCart.delete(item.item.item_id);
    this.cart.set(currentCart);
    const offer = this.offer();
    if (offer) {
      if (currentCart.size === 0) {
        this.clearCartFromLocalStorage(offer.offer_id);
      } else {
        this.saveCartToLocalStorage(offer.offer_id);
      }
    }
  }
}
