import {
  Component,
  inject,
  signal,
  computed,
  effect,
  untracked,
  ChangeDetectionStrategy,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of, catchError } from 'rxjs';
import { TimelineItem } from '../../../shared/components/timeline-bar/timeline-bar';
import { PaymentMethodData } from '../../../shared/components/payment-method-card/payment-method-card';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { PageHeaderService } from '../../../core/page-header.service';
import { AuthService } from '../../../core/auth.service';
import { ChatService } from '../../../core/chat.service';
import { EchoService } from '../../../core/echo.service';
import { OfferService, Offer, OfferItem, CheckoutItem, MyOrder } from '../../../core/offer.service';
import { EditNotesDialog } from './edit-notes-dialog';
import { environment } from '../../../../environments/environment';
import { OfferMenuView } from './offer-menu-view';
import { OfferCheckoutView } from './offer-checkout-view';
import ManageOfferPage from '../manage/manage-offer-page';
import { UserProfileDialog } from '../../../shared/components/dialog/user-profile-dialog/user-profile-dialog';
import { ProfileService } from '../../../core/profile.service';
import { GiveRatingDialog } from '../../../shared/components/give-rating-dialog/give-rating-dialog';

type OfferDetailView = 'menu' | 'checkout';

@Component({
  selector: 'app-offer-detail-page',
  standalone: true,
  imports: [MatProgressSpinnerModule, OfferMenuView, OfferCheckoutView, ManageOfferPage],
  templateUrl: './offer-detail-page.html',
  styleUrls: ['./offer-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly offerService = inject(OfferService);
  private readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly echoService = inject(EchoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly pageHeader = inject(PageHeaderService);
  private readonly profileService = inject(ProfileService);

  offer = signal<Offer | null>(null);
  cart = signal<Map<number, CheckoutItem>>(new Map());
  isLoading = signal(true);
  view = signal<OfferDetailView>('menu');

  readonly isSeller = computed(() => {
    const offer = this.offer();
    return !!offer && offer.seller_id === this.authService.user()?.user_id;
  });

  // Whether the backend already has a placed order for this offer. Backed by
  // the server (fetched on load, updated after place/replace/cancel) rather
  // than any local cache, since the order itself only really exists there.
  protected hasPlacedOrder = signal(false);

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
  uploadProgress = signal<number | null>(null);
  currentProgressStep = computed(() => {
    const offer = this.offer();
    const order = this.myOrder();

    if (offer && order) {
      if (offer.arrived_at != null) return 4;
      if (order.confirmed_at != null) return 3;
      if (order.payment_submitted_at != null) return 2;
      if (offer.closed_at != null) return 1;
    }
    return 0;
  });
  isOfferClosed = computed(() => this.offer()?.closed_at != null);

  progressItems = computed<TimelineItem[]>(() => {
    const offer = this.offer();
    const order = this.myOrder();
    return [
      { label: $localize`Offer joined`, time: order?.joined_at },
      // closed_at/arrived_at are the actual event times, set once the
      // seller acts; fall back to the seller's planned schedule until then.
      {
        label: offer?.closed_at ? $localize`Offer closed` : $localize`Offer closes`,
        time: offer?.closed_at ?? offer?.closing_time,
      },
      { label: $localize`Payment made`, time: order?.payment_submitted_at ?? undefined },
      { label: $localize`Payment confirmed`, time: order?.confirmed_at ?? undefined },
      {
        label: offer?.arrived_at ? $localize`Items arrived` : $localize`Items arrive`,
        time: offer?.arrived_at ?? offer?.arrival_time,
      },
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

  // Bound once so add/removeEventListener target the same reference.
  private readonly cleanupOrphanedProofBound = () => this.cleanupOrphanedProof();

  private previousArrivedAt: string | null = null;
  private isRatingDialogOpen = false;

  constructor() {
    effect(() => {
      const offer = this.offer();
      const order = this.myOrder();
      
      if (offer && order) {
        const arrivedAt = offer.arrived_at;
        const isArrived = arrivedAt !== null;
        const hasRated = offer.seller.has_rated_seller;
        const offerId = offer.offer_id.toString();
        
        const dismissedLater = localStorage.getItem(`dismissed_rating_${offerId}`) === 'true';
        
        if (isArrived && !hasRated && !dismissedLater) {
          const realTimeTransition = this.previousArrivedAt === null && arrivedAt !== null;
          
          if (realTimeTransition || this.view() === 'checkout') {
            untracked(() => this.openRatingDialog(offer));
          }
        }
        
        this.previousArrivedAt = arrivedAt;
      }
    });

    effect(() => {
      if (!this.authService.user()) {
        const currentView = untracked(() => this.view());
        if (currentView === 'checkout') {
          this.view.set('menu');
          this.myOrder.set(null);
          this.hasPlacedOrder.set(false);
        }
      }
    });

    window.addEventListener('beforeunload', this.cleanupOrphanedProofBound);

    const offerId = this.route.snapshot.paramMap.get('id');
    if (!offerId) {
      this.router.navigate(['/offers']);
      return;
    }

    this.loadOfferData(offerId);
  }

  ngOnInit(): void {
    const offerId = this.route.snapshot.paramMap.get('id');
    if (offerId) {
      this.echoService.listenToOfferUpdates(offerId, () => {
        this.loadOfferData(offerId);
      });
    }
  }

  ngOnDestroy(): void {
    const offerId = this.route.snapshot.paramMap.get('id');
    if (offerId) {
      this.echoService.leaveOfferChannel(offerId);
    }
    window.removeEventListener('beforeunload', this.cleanupOrphanedProofBound);
    this.cleanupOrphanedProof();
  }

  private loadOfferData(offerId: string): void {
    forkJoin({
      offer: this.offerService.getOfferById(offerId),
      order: this.authService.user()
        ? this.offerService.getMyOrder(+offerId).pipe(catchError(() => of({ data: null })))
        : of({ data: null }),
    }).subscribe({
      next: ({ offer, order: orderRes }) => {
        this.offer.set(offer);
        this.pageHeader.setTitle(offer.merchant_name);
        this.setBreadcrumbs(offer);

        const isSeller = offer.seller_id === this.authService.user()?.user_id;
        const order = orderRes.data;
        const hasOrder = !!order && order.items.length > 0;

        if (!isSeller && !hasOrder && offer.closed_at !== null) {
          this.router.navigate(['/offers']);
          return;
        }

        if (isSeller) {
          this.isLoading.set(false);
          return;
        }

        if (hasOrder && order) {
          const cartMap = new Map<number, CheckoutItem>();
          order.items.forEach((item) => cartMap.set(item.item.item_id, item));
          this.cart.set(cartMap);
          this.view.set('checkout');
          this.hasPlacedOrder.set(true);
          this.myOrder.set(order);
          this.loadPaymentMethods();

          if (
            this.authService.user() &&
            sessionStorage.getItem(`autoPlaceOrder_${offerId}`) === 'true'
          ) {
            sessionStorage.removeItem(`autoPlaceOrder_${offerId}`);
            this.snackBar.open($localize`You already have an existing order in this offer.`, $localize`Close`, {
              duration: 5000,
            });
          }
        } else {
          this.loadDraftCart(offerId);
          this.updateCartItemsWithFreshData(offer);
          this.isLoading.set(false);

          if (
            this.authService.user() &&
            sessionStorage.getItem(`autoPlaceOrder_${offerId}`) === 'true'
          ) {
            sessionStorage.removeItem(`autoPlaceOrder_${offerId}`);
            this.onPlaceOrder();
          }
        }
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offers']);
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

  private setBreadcrumbs(offer: Offer) {
    this.pageHeader.setBreadcrumbs([
      { label: $localize`Offers`, route: '/offers' },
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

  isItemOutOfStock(item: OfferItem): boolean {
    return item.current_slot >= item.slot;
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

  onPlaceOrder() {
    const offer = this.offer();
    if (!offer || this.totalItems() === 0) return;

    if (!this.authService.user()) {
      sessionStorage.setItem('authReturnUrl', this.router.url);
      sessionStorage.setItem(`autoPlaceOrder_${offer.offer_id}`, 'true');
      this.router.navigate(['/signin']);
      return;
    }

    const items = this.cartItems().map((cartItem) => ({
      item_id: cartItem.item.item_id,
      quantity: cartItem.quantity,
      notes: cartItem.notes,
    }));

    if (this.hasPlacedOrder()) {
      this.offerService.replaceOrder(offer.offer_id, items).subscribe({
        next: () => {
          this.snackBar.open($localize`Order saved successfully.`, $localize`Close`, { duration: 3000 });
          this.finishPlacingOrder(offer);
        },
        error: (err) => {
          console.error('Failed to replace order:', err);
          const msg = err.error?.message || 'Please try again.';
          const status = err.status ? ` (${err.status})` : '';
          this.snackBar.open(`Failed to save order: ${msg}${status}`, $localize`Close`, { duration: 5000 });
        },
      });
    } else {
      this.offerService.placeOrder(offer.offer_id, items).subscribe({
        next: () => {
          this.snackBar.open($localize`Order placed successfully.`, $localize`Close`, { duration: 3000 });
          this.finishPlacingOrder(offer);
        },
        error: (err) => {
          console.error('Failed to place order:', err);
          const msg = err.error?.message || 'Please try again.';
          const status = err.status ? ` (${err.status})` : '';
          this.snackBar.open(`Failed to place order: ${msg}${status}`, $localize`Close`, { duration: 5000 });
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
        title: $localize`Cancel Order`,
        content: $localize`Are you sure you want to cancel this order?<br>This action cannot be undone.`,
        buttons: [
          {
            label: $localize`Keep order`,
            type: 'outlined',
            focus: true,
          },
          {
            label: $localize`Cancel order`,
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
        this.snackBar.open($localize`Order cancelled successfully.`, $localize`Close`, { duration: 3000 });
        this.clearCartFromLocalStorage(String(offer.offer_id));
        this.router.navigate(['/offers']);
      },
      error: (err) => {
        console.error('Failed to cancel order:', err);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open(`Failed to cancel order: ${msg}${status}`, $localize`Close`, { duration: 5000 });
      },
    });
  }

  /**
   * Potential buyers who haven't joined yet can't see the offer's group
   * chat, so they get a private 1:1 with the seller instead. The seller and
   * anyone who's already joined go straight to the group chat.
   */
  openChat() {
    const offer = this.offer();
    if (!offer) return;

    if (this.isSeller() || this.myOrder() !== null) {
      this.router.navigate(['/offers', offer.offer_id, 'chat']);
      return;
    }

    this.chatService.findOrCreatePrivateConversation(offer.seller_id).subscribe({
      next: (conversation) => this.router.navigate(['/chat', conversation.id]),
      error: (err) => {
        console.error('Failed to open chat:', err);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open(`Failed to open chat: ${msg}${status}`, $localize`Close`, { duration: 5000 });
      },
    });
  }

  private uploadedProofUrl = signal<string | null>(null);

  // cleanup is now handled in ngOnDestroy

  /** Deletes a picked-and-uploaded-but-never-submitted proof file, so reloading/navigating away doesn't leave it orphaned on the server. */
  private cleanupOrphanedProof() {
    const url = this.uploadedProofUrl();
    if (url && !this.myOrder()?.payment_submitted_at) {
      this.offerService.deleteUpload(url);
    }
  }

  onProofOfPaymentChange(file: File | null) {
    this.cleanupOrphanedProof();
    this.proofOfPayment.set(file);
    this.uploadedProofUrl.set(null);

    if (!file) {
      this.uploadProgress.set(null);
      return;
    }

    this.uploadProgress.set(0);
    this.offerService.uploadImageWithProgress(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgress.set(null);
          this.uploadedProofUrl.set(event.body?.url ?? null);
        }
      },
      error: (err) => {
        console.error('Failed to upload proof of payment:', err);
        this.uploadProgress.set(null);
        this.proofOfPayment.set(null);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open(`Failed to upload proof of payment: ${msg}${status}`, $localize`Close`, {
          duration: 5000,
        });
      },
    });
  }

  completePayment() {
    const offer = this.offer();
    const proofUrl = this.uploadedProofUrl();
    if (!offer || !proofUrl || this.uploadProgress() !== null) return;

    this.submitPayment(offer.offer_id, proofUrl);
  }

  private submitPayment(offerId: number, proofUrl: string) {
    // Deliberately leave proofOfPayment/uploadedProofUrl set on success —
    // the file card stays displayed in the payment proof section.
    this.offerService.submitPayment(offerId, proofUrl).subscribe({
      next: () => {
        this.snackBar.open($localize`Payment submitted successfully.`, $localize`Close`, { duration: 3000 });
        this.offerService.getMyOrder(offerId).subscribe({
          next: (res) => this.myOrder.set(res.data),
          error: (err) => console.error('Failed to refresh order status:', err),
        });
      },
      error: (err) => {
        console.error('Failed to submit payment:', err);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open(`Failed to submit payment: ${msg}${status}`, $localize`Close`, {
          duration: 5000,
        });
      },
    });
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
        title: $localize`Remove Item`,
        content: $localize`Are you sure you want to remove this item from your cart?`,
        buttons: [
          {
            label: $localize`Cancel`,
            type: 'outlined',
            focus: true,
          },
          {
            label: $localize`Remove`,
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

  openSellerProfile(userId: string) {
    this.dialog.open(UserProfileDialog, {
      data: { userId },
    });
  }

  openRatingDialog(offer?: Offer) {
    if (this.isRatingDialogOpen) return;
    const currentOffer = offer ?? this.offer();
    if (!currentOffer) return;

    this.isRatingDialogOpen = true;
    const dialogRef = this.dialog.open(GiveRatingDialog, {
      width: '400px',
      data: { merchantName: currentOffer.merchant_name }
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.isRatingDialogOpen = false;
      const offerId = currentOffer.offer_id.toString();
      
      if (result === 'later') {
        localStorage.setItem(`dismissed_rating_${offerId}`, 'true');
      } else if (result && result.rating) {
        this.profileService.rateSeller(currentOffer.seller_id, result.rating, currentOffer.offer_id).subscribe({
          next: () => {
            this.snackBar.open('Rating submitted successfully.', 'Close', { duration: 3000 });
            const updatedOffer = this.offer();
            if (updatedOffer) {
               this.offer.update(o => o ? {
                 ...o,
                 seller: { ...o.seller, has_rated_seller: true }
               } : null);
            }
          },
          error: (err) => {
            console.error('Failed to submit rating:', err);
            const msg = err.error?.message || 'Please try again.';
            const status = err.status ? ` (${err.status})` : '';
            this.snackBar.open(`Failed to submit rating: ${msg}${status}`, 'Close', { duration: 5000 });
          }
        });
      }
    });
  }
}
