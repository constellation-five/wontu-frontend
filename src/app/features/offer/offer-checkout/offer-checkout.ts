import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CustomCardComponent } from '../../../shared/components/frame-card';
import { EditNotesDialog } from '../offer-detail/edit-notes-dialog';
import { OfferProgressComponent } from '../../../shared/components/offer-progress';

import { OfferService } from '../../../core/offer.service';
import { CartService, CartItem } from '../../../core/cart.service';
import { Offer, OfferItem } from '../../../core/offer';
import { PageHeaderService } from '../../../core/page-header.service';

@Component({
  selector: 'offer-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    CustomCardComponent,
    OfferProgressComponent,
  ],
  templateUrl: './offer-checkout.html',
  styleUrls: ['./offer-checkout.scss'],
})
export class OfferCheckoutPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offerService = inject(OfferService);
  private readonly cartService = inject(CartService);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);

  offer = signal<Offer | null>(null);
  isLoading = signal<boolean>(true);
  cartItems = signal<CartItem[]>([]);

  // Progress tracking
  currentStep = signal<number>(0); // 0 = offer joined
  userRole = signal<'buyer' | 'seller'>('buyer');

  // Check if offer is closed
  get isOfferClosed(): boolean {
    return this.offer()?.is_completed || false;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOffer(id);
      // Load cart from service
      const savedCart = this.cartService.getCartItems();
      if (savedCart.length === 0) {
        // If no cart items, redirect back to offer detail
        this.router.navigate(['/offer', id]);
      } else {
        this.cartItems.set(savedCart);
      }
    } else {
      this.router.navigate(['/offer']);
    }
  }

  loadOffer(id: string) {
    this.isLoading.set(true);
    this.offerService.getOfferById(id).subscribe({
      next: (data) => {
        this.offer.set(data);
        this.pageHeaderService.setBreadcrumbs([
          { label: 'Offers', route: '/offer' },
          { label: data.merchant_name, route: `/offer/${data.offer_id}` },
          { label: 'Your Order' },
        ]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offer']);
      },
    });
  }

  increaseQuantity(cartItem: CartItem) {
    this.cartItems.update((cart) =>
      cart.map((ci) =>
        ci.item.item_id === cartItem.item.item_id ? { ...ci, quantity: ci.quantity + 1 } : ci,
      ),
    );
    // Sync with cart service
    this.cartService.setCartItems(this.cartItems());
  }

  decreaseQuantity(cartItem: CartItem) {
    if (cartItem.quantity === 1) {
      this.cartItems.update((cart) =>
        cart.filter((ci) => ci.item.item_id !== cartItem.item.item_id),
      );
    } else {
      this.cartItems.update((cart) =>
        cart.map((ci) =>
          ci.item.item_id === cartItem.item.item_id ? { ...ci, quantity: ci.quantity - 1 } : ci,
        ),
      );
    }
    // Sync with cart service
    this.cartService.setCartItems(this.cartItems());
  }

  getCartTotal(): number {
    return this.cartItems().reduce((total, ci) => total + +ci.item.item_price * ci.quantity, 0);
  }

  isCartItemMaxQuantity(cartItem: CartItem): boolean {
    return cartItem.quantity >= cartItem.item.slot - cartItem.item.current_slot;
  }

  editCartItemNotes(cartItem: CartItem) {
    const dialogRef = this.dialog.open(EditNotesDialog, {
      width: '400px',
      data: { notes: cartItem.notes || '' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.cartItems.update((cart) =>
          cart.map((ci) =>
            ci.item.item_id === cartItem.item.item_id ? { ...ci, notes: result } : ci,
          ),
        );
        // Sync with cart service
        this.cartService.setCartItems(this.cartItems());
      }
    });
  }

  editOrder() {
    const currentOffer = this.offer();
    const currentCart = this.cartItems();

    if (!currentOffer) return;

    // Save current cart state
    this.cartService.setCartItems([...currentCart]);

    // Navigate back to offer detail
    this.router.navigate(['/offer', currentOffer.offer_id]);
  }

  goToChat() {
    const currentOffer = this.offer();
    if (!currentOffer) return;

    this.router.navigate(['/offer', currentOffer.offer_id, 'chat']);
  }

  cancelOrder() {
    const currentOffer = this.offer();
    const currentCart = this.cartItems();

    if (!currentOffer || currentCart.length === 0) return;

    // Prepare items data for cancel
    const items = currentCart.map((ci) => ({
      item_id: ci.item.item_id,
      quantity: ci.quantity,
    }));

    console.log('Canceling order:', items);

    this.offerService.cancelOrder(currentOffer.offer_id, items).subscribe({
      next: (response: any) => {
        console.log('Cancel order response:', response);

        // Clear cart and placed order
        this.cartService.clearCart();

        // Navigate back to offer detail
        this.router.navigate(['/offer', currentOffer.offer_id]);
      },
      error: (err) => {
        console.error('Failed to cancel order:', err);
        alert(err.error?.message || 'Failed to cancel order. Please try again.');
      },
    });
  }
}
