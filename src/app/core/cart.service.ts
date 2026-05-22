import { Injectable, signal } from '@angular/core';
import { OfferItem } from './offer.service';

export interface CartItem {
  item: OfferItem;
  quantity: number;
  notes?: string;
}

export interface PlacedOrder {
  offerId: number;
  items: CartItem[];
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly cartItems = signal<CartItem[]>([]);
  private readonly placedOrder = signal<PlacedOrder | null>(null);

  // Get all cart items
  getCartItems() {
    return this.cartItems();
  }

  // Set cart items (used when navigating to checkout)
  setCartItems(items: CartItem[]) {
    this.cartItems.set(items);
  }

  // Get placed order (order yang sudah di-place sebelumnya)
  getPlacedOrder() {
    return this.placedOrder();
  }

  // Set placed order (simpan order yang sudah di-place)
  setPlacedOrder(order: PlacedOrder | null) {
    this.placedOrder.set(order);
  }

  // Add item to cart
  addItem(item: OfferItem) {
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
  }

  // Update item quantity
  updateQuantity(itemId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(itemId);
    } else {
      this.cartItems.update((cart) =>
        cart.map((ci) => (ci.item.item_id === itemId ? { ...ci, quantity } : ci)),
      );
    }
  }

  // Update item notes
  updateNotes(itemId: number, notes: string) {
    this.cartItems.update((cart) =>
      cart.map((ci) => (ci.item.item_id === itemId ? { ...ci, notes } : ci)),
    );
  }

  // Remove item from cart
  removeItem(itemId: number) {
    this.cartItems.update((cart) => cart.filter((ci) => ci.item.item_id !== itemId));
  }

  // Clear cart
  clearCart() {
    this.cartItems.set([]);
    this.placedOrder.set(null);
  }

  // Get cart total
  getTotal(): number {
    return this.cartItems().reduce((total, ci) => total + +ci.item.item_price * ci.quantity, 0);
  }

  // Check if item is in cart
  isItemInCart(itemId: number): boolean {
    return this.cartItems().some((ci) => ci.item.item_id === itemId);
  }

  // Get item quantity
  getItemQuantity(itemId: number): number {
    return this.cartItems().find((ci) => ci.item.item_id === itemId)?.quantity || 0;
  }

  // Calculate quantity difference for edit order
  // Returns: { item_id, quantityDiff } where positive = add more, negative = reduce
  getQuantityDifferences(): { item_id: number; quantityDiff: number }[] {
    const currentCart = this.cartItems();
    const placed = this.placedOrder();

    console.log('=== Calculating Quantity Differences ===');
    console.log(
      'Current cart:',
      currentCart.map((c) => ({ id: c.item.item_id, name: c.item.item_name, qty: c.quantity })),
    );
    console.log(
      'Placed order:',
      placed?.items.map((c) => ({ id: c.item.item_id, name: c.item.item_name, qty: c.quantity })),
    );

    if (!placed) {
      console.log('No placed order found');
      return [];
    }

    const differences: { item_id: number; quantityDiff: number }[] = [];

    // Check items in current cart
    currentCart.forEach((currentItem) => {
      const placedItem = placed.items.find((pi) => pi.item.item_id === currentItem.item.item_id);
      if (placedItem) {
        const diff = currentItem.quantity - placedItem.quantity;
        console.log(
          `Item ${currentItem.item.item_name}: current=${currentItem.quantity}, placed=${placedItem.quantity}, diff=${diff}`,
        );
        if (diff !== 0) {
          differences.push({ item_id: currentItem.item.item_id, quantityDiff: diff });
        }
      } else {
        // New item added
        console.log(`Item ${currentItem.item.item_name}: NEW item, qty=${currentItem.quantity}`);
        differences.push({ item_id: currentItem.item.item_id, quantityDiff: currentItem.quantity });
      }
    });

    // Check items that were removed from cart
    placed.items.forEach((placedItem) => {
      const currentItem = currentCart.find((ci) => ci.item.item_id === placedItem.item.item_id);
      if (!currentItem) {
        // Item removed completely
        console.log(`Item ${placedItem.item.item_name}: REMOVED, qty was ${placedItem.quantity}`);
        differences.push({ item_id: placedItem.item.item_id, quantityDiff: -placedItem.quantity });
      }
    });

    console.log('Final differences:', differences);
    console.log('=== End Calculation ===');

    return differences;
  }
}
