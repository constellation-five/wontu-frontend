import { Component, inject, signal, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { PageHeaderService } from '../../../core/page-header.service';
import { AuthService } from '../../../core/auth.service';
import { Offer, CheckoutItem, OfferService } from '../../../core/offer.service';
import { ButtonSizeDirective } from '../../../shared/directives/button';
import { IconButtonVariantDirective } from '../../../shared/directives/button/icon-button-variant';
import { EditNotesDialog } from './edit-notes-dialog';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { DecimalPipe } from '@angular/common';
import { CounterField } from '../../../shared/components/counter-field/counter-field';
import { of } from 'rxjs';

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
    CounterField,
  ],
  templateUrl: './offer-mobile-cart.html',
  styleUrls: ['./offer-mobile-cart.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferMobileCart implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeader = inject(PageHeaderService);
  private readonly authService = inject(AuthService);
  private readonly offerService = inject(OfferService);
  private readonly snackBar = inject(MatSnackBar);

  offer = signal<Offer | null>(null);
  cart = signal<Map<number, CheckoutItem>>(new Map());
  isLoading = signal(true);

  cartItems = computed(() => Array.from(this.cart().values()));
  totalItems = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));
  totalPrice = computed(() =>
    this.cartItems().reduce((sum, item) => sum + +item.item.item_price * item.quantity, 0),
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
      // Direct navigation, refresh, or back/forward: no history.state to
      // restore from. This page is only for building a draft cart before an
      // order is placed, so if one already exists for this offer, send the
      // user to the real order view instead of a stale "browsing" cart.
      const checkOrder: any = this.authService.user() 
        ? this.offerService.getMyOrder(+offerId) 
        : of({ data: null });
        
      checkOrder.subscribe({
        next: (res: any) => {
          if (res.data && res.data.items.length > 0) {
            this.router.navigate(['/offers', offerId]);
            return;
          }
          this.loadCartFromLocalStorage(offerId);
          this.loadOffer(offerId);
        },
        error: () => {
          this.loadCartFromLocalStorage(offerId);
          this.loadOffer(offerId);
        },
      });
    } else {
      this.router.navigate(['/offers']);
      return;
    }

    this.pageHeader.setTitle($localize`Cart`);
    this.pageHeader.setBreadcrumbs([
      { label: $localize`Offers`, route: '/offers' },
      { label: this.offer()?.merchant_name || 'Offer', route: `/offers/${this.offer()?.offer_id}` },
      { label: $localize`Cart` },
    ]);

    // Auto-redirect to offer-detail when resizing to desktop
    if (typeof window !== 'undefined') {
      this.resizeListener = this.handleResize.bind(this);
      window.addEventListener('resize', this.resizeListener);
      this.checkScreenSize();
    }
  }

  private resizeListener?: () => void;

  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private loadOffer(id: string) {
    this.isLoading.set(true);
    this.offerService.getOfferById(id).subscribe({
      next: (offer) => {
        this.offer.set(offer);
        this.pageHeader.setTitle(offer.merchant_name);
        this.pageHeader.setBreadcrumbs([
          { label: $localize`Offers`, route: '/offers' },
          { label: offer.merchant_name, route: `/offers/${offer.offer_id}` },
          { label: $localize`Cart` },
        ]);
        this.isLoading.set(false);
        if (this.authService.user() && sessionStorage.getItem(`autoPlaceOrder_${id}`) === 'true') {
          sessionStorage.removeItem(`autoPlaceOrder_${id}`);
          this.onPlaceOrder();
        }
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
            cart: Array.from(this.cart().entries()),
          },
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
        cart: Array.from(this.cart().entries()),
      },
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

    // This page only ever builds a draft cart before an order exists (see the
    // constructor's redirect when an order is already found), so placing here
    // is always a fresh order, never an edit of an existing one.
    this.offerService.placeOrder(offer.offer_id, items).subscribe({
      next: () => {
        this.snackBar.open($localize`Order placed successfully.`, $localize`Close`, { duration: 3000 });
        this.clearCartFromLocalStorage(offer.offer_id);
        this.router.navigate(['/offers', offer.offer_id]);
      },
      error: (err) => {
        console.error('Failed to place order:', err);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open($localize`Failed to place order: ${msg}${status}`, $localize`Close`, { duration: 5000 });
      },
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
