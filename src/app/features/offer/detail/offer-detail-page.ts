import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { DecimalPipe } from '@angular/common';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { CounterField } from '../../../shared/components/counter-field/counter-field';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { CartItemCard } from './cart-item-card/cart-item-card';
import { TimelineBar, TimelineItem } from '../../../shared/components/timeline-bar/timeline-bar';
import {
  PaymentMethodCard,
  PaymentMethodData,
} from '../../../shared/components/payment-method-card/payment-method-card';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { PageHeaderService } from '../../../core/page-header.service';
import { OfferService, Offer, OfferItem, CheckoutItem, MyOrder } from '../../../core/offer.service';
import { ButtonSizeDirective, ButtonColorDirective } from '../../../shared/directives/button';
import { EditNotesDialog } from './edit-notes-dialog';
import { environment } from '../../../../environments/environment';

type OfferDetailView = 'menu' | 'checkout';

@Component({
  selector: 'app-offer-detail-page',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ProductCardComponent,
    CounterField,
    PaneComponent,
    CartItemCard,
    TimelineBar,
    PaymentMethodCard,
    ButtonSizeDirective,
    ButtonColorDirective,
    DecimalPipe,
  ],
  templateUrl: './offer-detail-page.html',
  styleUrls: ['./offer-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly offerService = inject(OfferService);
  private readonly dialog = inject(MatDialog);
  protected readonly pageHeader = inject(PageHeaderService);

  offer = signal<Offer | null>(null);
  cart = signal<Map<number, CheckoutItem>>(new Map());
  isLoading = signal(true);
  view = signal<OfferDetailView>('menu');

  // Whether the backend already has a placed order for this offer. Backed by
  // the server (fetched on load, updated after place/replace/cancel) rather
  // than any local cache, since the order itself only really exists there.
  private hasPlacedOrder = signal(false);

  // The buyer's order metadata (status/timestamps) for this offer, if any.
  // Separate from `cart`, which only tracks the item quantities/notes.
  myOrder = signal<MyOrder | null>(null);

  // Checkout view state
  paymentMethods = signal<PaymentMethodData[]>([]);
  // Shown in place of a real payment method when the seller hasn't set one up yet.
  readonly dummyPaymentMethod: PaymentMethodData = {
    payment_method_id: 0,
    bank_name: 'Bank Negara Indonesia',
    account_name: 'Ujang Yusuf',
    account_number: '1020-3782832-283982382',
  };
  proofOfPayment = signal<File | null>(null);
  currentProgressStep = signal(0); // 0 = Offer joined
  isOfferClosed = computed(() => this.offer()?.is_completed ?? false);

  progressItems = computed<TimelineItem[]>(() => {
    const offer = this.offer();
    const order = this.myOrder();
    return [
      { label: 'Offer joined', time: order?.joined_at },
      // closed_at/arrived_at are the actual event times, set once the
      // seller acts; fall back to the seller's planned schedule until then.
      { label: 'Offer closes', time: offer?.closed_at ?? offer?.closing_time },
      { label: 'Payment made', time: order?.payment_submitted_at ?? undefined },
      { label: 'Payment confirmed', time: order?.verified_at ?? undefined },
      { label: 'Items arrive', time: offer?.arrived_at ?? offer?.arrival_time },
    ];
  });

  cartItems = computed(() => Array.from(this.cart().values()));
  totalItems = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));
  totalPrice = computed(() =>
    this.cartItems().reduce((sum, item) => sum + +item.item.item_price * item.quantity, 0),
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
    if (!offerId) {
      this.router.navigate(['/offers']);
      return;
    }

    this.offerService.getMyOrder(+offerId).subscribe({
      next: (res) => {
        const order = res.data;
        if (order && order.items.length > 0) {
          const cartMap = new Map<number, CheckoutItem>();
          order.items.forEach((item) => cartMap.set(item.item.item_id, item));
          this.cart.set(cartMap);
          this.view.set('checkout');
          this.hasPlacedOrder.set(true);
          this.myOrder.set(order);
        } else {
          this.loadDraftCart(offerId);
        }
        this.loadOffer(offerId);
      },
      error: (err) => {
        console.error('Failed to load order status:', err);
        this.loadDraftCart(offerId);
        this.loadOffer(offerId);
      },
    });
  }

  private loadDraftCart(offerId: string) {
    const state = history.state;
    if (state && state['cart']) {
      const cartMap = new Map<number, CheckoutItem>(state['cart']);
      this.cart.set(cartMap);
      this.saveCartToLocalStorage(offerId);
    } else {
      this.loadCartFromLocalStorage(offerId);
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
        this.setBreadcrumbs(offer);

        // Update cart items with fresh offer data
        this.updateCartItemsWithFreshData(offer);

        if (this.view() === 'checkout') {
          this.loadPaymentMethods();
        } else {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offers']);
      },
    });
  }

  private setBreadcrumbs(offer: Offer) {
    this.pageHeader.setBreadcrumbs([
      { label: 'Offers', route: '/offers' },
      { label: offer.merchant_name },
    ]);
  }

  private loadPaymentMethods() {
    const offerId = this.offer()?.offer_id;
    if (!offerId) return;

    this.http
      .get<any>(`${environment.api}/offers/${offerId}/payment-methods`, {
        withCredentials: true,
      })
      .subscribe({
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

  private updateCartItemsWithFreshData(offer: Offer) {
    const currentCart = this.cart();
    if (currentCart.size === 0) return;

    const updatedCart = new Map<number, CheckoutItem>();
    currentCart.forEach((checkoutItem, itemId) => {
      const freshItem = offer.items.find((item) => item.item_id === itemId);
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

    // Save updated cart to localStorage (only meaningful for a draft, pre-order cart)
    if (!this.hasPlacedOrder()) {
      const offerId = this.route.snapshot.paramMap.get('id');
      if (offerId) {
        this.saveCartToLocalStorage(offerId);
      }
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

  isItemInCart(itemId: number): boolean {
    return this.cart().has(itemId);
  }

  getItemQuantity(itemId: number): number {
    return this.cart().get(itemId)?.quantity || 0;
  }

  isItemOutOfStock(item: OfferItem): boolean {
    return item.current_slot >= item.slot;
  }

  formatItemPrice(item: OfferItem): string {
    return 'Rp ' + (+item.item_price).toLocaleString('id-ID');
  }

  getItemStockText(item: OfferItem): string {
    const remaining = item.slot - item.current_slot;
    return remaining > 0 ? `Stock: ${remaining} left` : 'Out of Stock';
  }

  getItemStockVariant(item: OfferItem): 'default' | 'low' {
    return item.slot - item.current_slot > 5 ? 'default' : 'low';
  }

  onItemCounterChange(item: OfferItem, newValue: number, field: CounterField) {
    const current = this.getItemQuantity(item.item_id);

    if (newValue > current) {
      this.onIncreaseQuantity(item.item_id);
    } else if (newValue < current) {
      if (current === 1) {
        // Decreasing past 1 opens a remove-confirmation dialog rather than
        // actually changing the quantity, so snap the field back visually.
        field.value.set(1);
      }
      this.onDecreaseQuantity(item.item_id);
    }
  }

  onPlaceOrder() {
    const offer = this.offer();
    if (!offer || this.totalItems() === 0) return;

    const items = this.cartItems().map((cartItem) => ({
      item_id: cartItem.item.item_id,
      quantity: cartItem.quantity,
      notes: cartItem.notes,
    }));

    if (this.hasPlacedOrder()) {
      this.offerService.replaceOrder(offer.offer_id, items).subscribe({
        next: () => this.finishPlacingOrder(offer),
        error: (err) => {
          console.error('Failed to replace order:', err);
          alert('Failed to update order. Please try again.');
        },
      });
    } else {
      this.offerService.placeOrder(offer.offer_id, items).subscribe({
        next: () => this.finishPlacingOrder(offer),
        error: (err) => {
          console.error('Failed to place order:', err);
          alert('Failed to place order. Please try again.');
        },
      });
    }
  }

  private finishPlacingOrder(offer: Offer) {
    this.clearCartFromLocalStorage(String(offer.offer_id));
    this.hasPlacedOrder.set(true);
    this.view.set('checkout');
    this.loadPaymentMethods();

    this.offerService.getMyOrder(offer.offer_id).subscribe({
      next: (res) => this.myOrder.set(res.data),
      error: (err) => console.error('Failed to refresh order status:', err),
    });
  }

  editOrder() {
    if (!this.offer()) return;
    this.view.set('menu');
  }

  openCancelOrderDialog() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '540px',
      data: {
        title: 'Cancel Order',
        content: 'Are you sure you want to cancel this order?<br>This action cannot be undone.',
        buttons: [
          {
            label: 'Keep order',
            type: 'outlined',
            focus: true,
          },
          {
            label: 'Cancel order',
            icon: 'close',
            type: 'filled',
            action: 'confirm',
            color: 'error',
          },
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.cancelOrder();
      }
    });
  }

  cancelOrder() {
    const offer = this.offer();
    if (!offer) return;

    this.offerService.cancelOrder(offer.offer_id).subscribe({
      next: () => {
        this.clearCartFromLocalStorage(String(offer.offer_id));
        this.router.navigate(['/offers']);
      },
      error: (err) => {
        console.error('Failed to cancel order:', err);
        alert('Failed to cancel order');
      },
    });
  }

  openChat() {
    const offer = this.offer();
    if (!offer) return;

    this.router.navigate(['/offers', offer.offer_id, 'chat']);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setProofOfPayment(input.files[0]);
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
      this.setProofOfPayment(event.dataTransfer.files[0]);
    }
  }

  private setProofOfPayment(file: File) {
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

  completePayment() {
    // TODO: Implement payment completion with file upload
    console.log('Complete payment', this.proofOfPayment());
  }

  navigateToMobileCart() {
    const offer = this.offer();
    if (!offer) return;

    this.router.navigate(['/offers', offer.offer_id, 'mobile-cart'], {
      state: {
        offer: offer,
        cartItems: this.cartItems(),
        cart: Array.from(this.cart().entries()),
      },
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
        content: 'Are you sure you want to remove this item from your cart?',
        buttons: [
          {
            label: 'Cancel',
            type: 'outlined',
            focus: true,
          },
          {
            label: 'Remove',
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
