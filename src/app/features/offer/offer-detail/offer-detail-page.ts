import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { DecimalPipe } from '@angular/common';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { CounterField } from '../../../shared/components/counter-field/counter-field';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { PageHeaderService } from '../../../core/page-header.service';
import { OfferService, Offer, OfferItem, CheckoutItem } from '../../../core/offer.service';
import { ButtonSizeDirective } from '../../../shared/directives/button';
import { IconButtonVariantDirective } from '../../../shared/directives/button/icon-button-variant';
import { EditNotesDialog } from './edit-notes-dialog';

@Component({
  selector: 'app-offer-detail-page',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ItemCardComponent,
    PaneComponent,
    CounterField,
    ButtonSizeDirective,
    IconButtonVariantDirective,
    DecimalPipe,
  ],
  templateUrl: './offer-detail-page.html',
  styleUrls: ['./offer-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offerService = inject(OfferService);
  private readonly dialog = inject(MatDialog);
  protected readonly pageHeader = inject(PageHeaderService);

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
  
  sortedItems = computed(() => {
    const items = this.offer()?.items || [];
    return [...items].sort((a, b) => {
      const aOutOfStock = this.isItemOutOfStock(a);
      const bOutOfStock = this.isItemOutOfStock(b);
      
      if (aOutOfStock && !bOutOfStock) return 1;
      if (!aOutOfStock && bOutOfStock) return -1;
      return 0;
    });
  });

  private selectedItemForRemoval = signal<CheckoutItem | null>(null);

  constructor() {
    const offerId = this.route.snapshot.paramMap.get('id');
    const state = history.state;

    if (offerId && state && state['editMode'] && state['currentItems']) {
      console.log('Edit mode activated with items:', state['currentItems']);
      const cartMap = new Map<number, CheckoutItem>();
      state['currentItems'].forEach((item: any) => {
        cartMap.set(item.item.item_id, item);
      });
      this.cart.set(cartMap);
      this.saveCartToLocalStorage(offerId);
    } else if (offerId && state && state['cart']) {
      const cartMap = new Map<number, CheckoutItem>(state['cart']);
      this.cart.set(cartMap);
      this.saveCartToLocalStorage(offerId);
    } else if (offerId) {
      this.loadCartFromLocalStorage(offerId);
    }

    if (offerId) {
      this.loadOffer(offerId);
    }
  }

  private saveCartToLocalStorage(offerId: string) {
    const cartData = Array.from(this.cart().entries());
    localStorage.setItem(`cart_${offerId}`, JSON.stringify(cartData));
  }

  private loadCartFromLocalStorage(offerId: string) {
    const saved = localStorage.getItem(`cart_${offerId}`);
    if (saved) {
      try {
        const cartData = JSON.parse(saved);
        const cartMap = new Map<number, CheckoutItem>(cartData);
        // Note: item data will be updated with fresh data after offer is loaded
        this.cart.set(cartMap);
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }
    }
  }

  private clearCartFromLocalStorage(offerId: string) {
    localStorage.removeItem(`cart_${offerId}`);
  }


  loadOffer(id: string) {
    this.isLoading.set(true);
    this.offerService.getOfferById(id).subscribe({
      next: (offer) => {
        this.offer.set(offer);
        this.pageHeader.setTitle(offer.merchant_name);
        this.pageHeader.setBreadcrumbs([
          { label: 'Offers', route: '/offers' },
          { label: offer.merchant_name },
        ]);
        
        // Update cart items with fresh offer data
        this.updateCartItemsWithFreshData(offer);
        
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offers']);
      },
    });
  }

  private updateCartItemsWithFreshData(offer: Offer) {
    const currentCart = this.cart();
    if (currentCart.size === 0) return;

    const updatedCart = new Map<number, CheckoutItem>();
    currentCart.forEach((checkoutItem, itemId) => {
      const freshItem = offer.items.find(item => item.item_id === itemId);
      if (freshItem) {
        // Keep the quantity and notes from cart, but update item data
        updatedCart.set(itemId, {
          item: freshItem,
          quantity: checkoutItem.quantity,
          notes: checkoutItem.notes,
        });
      }
    });

    this.cart.set(updatedCart);
    
    // Save updated cart to localStorage
    const offerId = this.route.snapshot.paramMap.get('id');
    if (offerId) {
      this.saveCartToLocalStorage(offerId);
    }
  }

  onAddToCart(item: OfferItem) {
    const currentCart = new Map(this.cart());
    const existingItem = currentCart.get(item.item_id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentCart.set(item.item_id, { item, quantity: 1 });
    }

    this.cart.set(currentCart);
    const offerId = this.route.snapshot.paramMap.get('id');
    if (offerId) {
      this.saveCartToLocalStorage(offerId);
    }
  }

  onRemoveItem(itemId: number) {
    const currentCart = new Map(this.cart());
    currentCart.delete(itemId);
    this.cart.set(currentCart);
    const offerId = this.route.snapshot.paramMap.get('id');
    if (offerId) {
      if (currentCart.size === 0) {
        this.clearCartFromLocalStorage(offerId);
      } else {
        this.saveCartToLocalStorage(offerId);
      }
    }
  }

  onIncreaseQuantity(itemId: number) {
    const currentCart = new Map(this.cart());
    const item = currentCart.get(itemId);

    if (item) {
      const stockRemaining = item.item.slot - item.item.current_slot;
      if (item.quantity < stockRemaining) {
        currentCart.set(itemId, { ...item, quantity: item.quantity + 1 });
        this.cart.set(currentCart);
        const offerId = this.route.snapshot.paramMap.get('id');
        if (offerId) {
          this.saveCartToLocalStorage(offerId);
        }
      }
    }
  }

  onDecreaseQuantity(itemId: number) {
    const currentCart = new Map(this.cart());
    const item = currentCart.get(itemId);

    if (item) {
      if (item.quantity > 1) {
        currentCart.set(itemId, { ...item, quantity: item.quantity - 1 });
        this.cart.set(currentCart);
        const offerId = this.route.snapshot.paramMap.get('id');
        if (offerId) {
          this.saveCartToLocalStorage(offerId);
        }
      } else {
        this.selectedItemForRemoval.set(item);
        this.openRemoveConfirm(item);
      }
    }
  }

  onCartCounterChange(cartItem: CheckoutItem, newValue: number, field: CounterField) {
    const itemId = cartItem.item.item_id;

    if (newValue > cartItem.quantity) {
      this.onIncreaseQuantity(itemId);
    } else if (newValue < cartItem.quantity) {
      if (cartItem.quantity === 1) {
        // Decreasing past 1 opens a remove-confirmation dialog rather than
        // actually changing the quantity, so snap the field back visually.
        field.value.set(1);
      }
      this.onDecreaseQuantity(itemId);
    }
  }

  isItemInCart(itemId: number): boolean {
    return this.cart().has(itemId);
  }

  getItemQuantity(itemId: number): number {
    return this.cart().get(itemId)?.quantity || 0;
  }

  isItemOutOfStock(item: OfferItem): boolean {
    return item.current_slot >= item.slot;
  }

  onPlaceOrder() {
    const offer = this.offer();
    if (!offer || this.totalItems() === 0) return;

    const items = this.cartItems().map(cartItem => ({
      item_id: cartItem.item.item_id,
      quantity: cartItem.quantity,
    }));

    console.log('Placing order with items:', items);

    // Check if this is an edit order scenario
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
          console.log('Order replaced successfully, navigating to checkout');
          
          // Update existing history (not create new)
          this.updateOrderHistory(offer.offer_id, offer.merchant_name);
          const offerId = this.route.snapshot.paramMap.get('id');
          if (offerId) {
            this.clearCartFromLocalStorage(offerId);
          }
          
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
          console.log('Order placed successfully, navigating to checkout with items:', this.cartItems());
          
          // Create new history entry
          this.saveOrderToHistory(offer.offer_id, offer.merchant_name);
          const offerId = this.route.snapshot.paramMap.get('id');
          if (offerId) {
            this.clearCartFromLocalStorage(offerId);
          }
          
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
      items: this.cartItems(), // This already includes full item data
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
          orderData.items = this.cartItems(); // Full item data with images
          orderData.merchantName = merchantName; // Update merchant name too
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

  navigateToMobileCart() {
    const offer = this.offer();
    if (!offer) return;
    
    this.router.navigate(['/offers', offer.offer_id, 'mobile-cart'], {
      state: {
        offer: offer,
        cartItems: this.cartItems(),
        cart: Array.from(this.cart().entries())
      }
    });
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
          currentCart.set(item.item.item_id, { ...item, notes: result });
          this.cart.set(currentCart);
          const offerId = this.route.snapshot.paramMap.get('id');
          if (offerId) {
            this.saveCartToLocalStorage(offerId);
          }
        }
      }
    });
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
    const offerId = this.route.snapshot.paramMap.get('id');
    if (offerId) {
      if (currentCart.size === 0) {
        this.clearCartFromLocalStorage(offerId);
      } else {
        this.saveCartToLocalStorage(offerId);
      }
    }
  }
}

