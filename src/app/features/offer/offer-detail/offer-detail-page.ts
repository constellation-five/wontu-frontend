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
import { CardItemComponent } from '../../../shared/components/card-item';
import { EditNotesDialog } from './edit-notes-dialog';
import { DialogComponent, DialogData } from '../../../shared/components/dialog';

import { OfferService } from '../../../core/offer.service';
import { CartService, CartItem } from '../../../core/cart.service';
import { PageHeaderService } from '../../../core/page-header.service';
import { Offer, OfferItem } from '../../../core/offer';

@Component({
  selector: 'offer-detail-page',
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
    CardItemComponent,
  ],
  templateUrl: './offer-detail-page.html',
  styleUrls: ['./offer-detail-page.scss'],
})
export class OfferDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offerService = inject(OfferService);
  private readonly cartService = inject(CartService);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);

  offer = signal<Offer | null>(null);
  isLoading = signal<boolean>(true);
  cartItems = signal<CartItem[]>([]);

  sortedItems = computed(() => {
    const currentOffer = this.offer();
    if (!currentOffer?.items) return [];

    return [...currentOffer.items].sort((a, b) => {
      const aInStock = a.slot - a.current_slot > 0;
      const bInStock = b.slot - b.current_slot > 0;

      if (aInStock && !bInStock) return -1;
      if (!aInStock && bInStock) return 1;
      return 0;
    });
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOffer(id);
      // Load cart from service
      this.cartItems.set(this.cartService.getCartItems());
    } else {
      this.router.navigate(['/offer']);
    }
  }

  loadOffer(id: string) {
    this.isLoading.set(true);
    this.offerService.getOfferById(id).subscribe({
      next: (data) => {
        console.log('Loaded offer data:', data); // Debug log
        this.offer.set(data);
        this.pageHeaderService.setBreadcrumbs([
          { label: 'Offers', route: '/offer' },
          { label: data.merchant_name },
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

  addToCart(item: OfferItem) {
    const currentCart = this.cartItems();
    const existingItem = currentCart.find((ci) => ci.item.item_id === item.item_id);

    if (existingItem) {
      this.cartItems.set(
        currentCart.map((ci) =>
          ci.item.item_id === item.item_id ? { ...ci, quantity: ci.quantity + 1 } : ci,
        ),
      );
    } else {
      this.cartItems.set([...currentCart, { item, quantity: 1 }]);
    }

    // Sync with cart service
    this.cartService.setCartItems(this.cartItems());
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
      // Show confirmation dialog
      const dialogData: DialogData = {
        title: 'Remove Item',
        content:
          'Setting the quantity to zero will remove this item from your cart.<br>Please confirm if you wish to proceed.',
        buttons: [
          {
            label: 'Cancel',
            type: 'outlined',
            action: 'cancel',
            borderColor: '#B3B8C7',
            textColor: '#52555D',
          },
          {
            label: 'Delete',
            icon: 'delete',
            type: 'filled',
            action: 'delete',
            bgColor: '#D32F2F',
            textColor: '#FFFFFF',
          },
        ],
      };

      const dialogRef = this.dialog.open(DialogComponent, {
        width: '540px',
        disableClose: true,
        hasBackdrop: true,
        autoFocus: false,
        data: dialogData,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'delete') {
          // User confirmed, remove item
          this.cartItems.update((cart) =>
            cart.filter((ci) => ci.item.item_id !== cartItem.item.item_id),
          );
          // Sync with cart service
          this.cartService.setCartItems(this.cartItems());
        }
      });
    } else {
      this.cartItems.update((cart) =>
        cart.map((ci) =>
          ci.item.item_id === cartItem.item.item_id ? { ...ci, quantity: ci.quantity - 1 } : ci,
        ),
      );
      // Sync with cart service
      this.cartService.setCartItems(this.cartItems());
    }
  }

  increaseQuantityFromCard(itemId: number) {
    this.cartItems.update((cart) =>
      cart.map((ci) => (ci.item.item_id === itemId ? { ...ci, quantity: ci.quantity + 1 } : ci)),
    );
    // Sync with cart service
    this.cartService.setCartItems(this.cartItems());
  }

  decreaseQuantityFromCard(itemId: number) {
    const item = this.cartItems().find((ci) => ci.item.item_id === itemId);
    if (!item) return;

    if (item.quantity === 1) {
      // Show confirmation dialog
      const dialogData: DialogData = {
        title: 'Remove Item',
        content:
          'Setting the quantity to zero will remove this item from your cart.<br>Please confirm if you wish to proceed.',
        buttons: [
          {
            label: 'Cancel',
            type: 'outlined',
            action: 'cancel',
            borderColor: '#B3B8C7',
            textColor: '#52555D',
          },
          {
            label: 'Delete',
            icon: 'delete',
            type: 'filled',
            action: 'delete',
            bgColor: '#D32F2F',
            textColor: '#FFFFFF',
          },
        ],
      };

      const dialogRef = this.dialog.open(DialogComponent, {
        width: '540px',
        disableClose: true,
        hasBackdrop: true,
        autoFocus: false,
        data: dialogData,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'delete') {
          // User confirmed, remove item
          this.cartItems.update((cart) => cart.filter((ci) => ci.item.item_id !== itemId));
          // Sync with cart service
          this.cartService.setCartItems(this.cartItems());
        }
      });
    } else {
      this.cartItems.update((cart) =>
        cart.map((ci) => (ci.item.item_id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci)),
      );
      // Sync with cart service
      this.cartService.setCartItems(this.cartItems());
    }
  }

  getCartTotal(): number {
    return this.cartItems().reduce((total, ci) => total + +ci.item.item_price * ci.quantity, 0);
  }

  isItemInCart(itemId: number): boolean {
    return this.cartItems().some((ci) => ci.item.item_id === itemId);
  }

  getItemQuantity(itemId: number): number {
    return this.cartItems().find((ci) => ci.item.item_id === itemId)?.quantity || 0;
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

  placeOrder() {
    const currentOffer = this.offer();
    const items = this.cartItems();

    if (!currentOffer || items.length === 0) return;

    const placedOrder = this.cartService.getPlacedOrder();

    // Check if this is a new order or replacing existing order
    if (placedOrder && placedOrder.offerId === currentOffer.offer_id) {
      // Replace existing order
      const oldItems = placedOrder.items.map((item) => ({
        item_id: item.item.item_id,
        quantity: item.quantity,
      }));

      const newItems = items.map((ci) => ({
        item_id: ci.item.item_id,
        quantity: ci.quantity,
      }));

      console.log('Replacing order - Old:', oldItems, 'New:', newItems);

      this.offerService.replaceOrder(currentOffer.offer_id, oldItems, newItems).subscribe({
        next: (response: any) => {
          console.log('Replace order response:', response);

          // Update placed order
          this.cartService.setPlacedOrder({
            offerId: currentOffer.offer_id,
            items: [...items],
          });

          // Update offer data
          if (response.offer) {
            this.offer.set(response.offer);
          }

          // Navigate to checkout
          this.router.navigate(['/offer', currentOffer.offer_id, 'checkout']);
        },
        error: (err) => {
          console.error('Failed to replace order:', err);
          alert(err.error?.message || 'Failed to place order. Please try again.');
        },
      });
    } else {
      // New order (first time)
      const orderItems = items.map((ci) => ({
        item_id: ci.item.item_id,
        quantity: ci.quantity,
      }));

      console.log('Placing new order:', orderItems);

      this.offerService.placeOrder(currentOffer.offer_id, orderItems).subscribe({
        next: (response: any) => {
          console.log('Place order response:', response);

          // Save placed order
          this.cartService.setPlacedOrder({
            offerId: currentOffer.offer_id,
            items: [...items],
          });

          // Update offer data
          if (response.offer) {
            this.offer.set(response.offer);
          }

          // Navigate to checkout
          this.router.navigate(['/offer', currentOffer.offer_id, 'checkout']);
        },
        error: (err) => {
          console.error('Failed to place order:', err);
          alert(err.error?.message || 'Failed to place order. Please try again.');
        },
      });
    }
  }
}
