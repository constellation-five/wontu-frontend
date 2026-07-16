import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { CounterField } from '../../../shared/components/counter-field/counter-field';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { CartItemCard } from '../../../shared/components/cart-item-card/cart-item-card';
import { ButtonSizeDirective } from '../../../shared/directives/button';
import { Offer, OfferItem, CheckoutItem } from '../../../core/offer.service';

@Component({
  selector: 'app-offer-menu-view',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    ProductCardComponent,
    CounterField,
    PaneComponent,
    CartItemCard,
    ButtonSizeDirective,
    DecimalPipe,
    NgTemplateOutlet,
  ],
  templateUrl: './offer-menu-view.html',
  styleUrls: ['./offer-menu-view.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferMenuView {
  readonly offer = input.required<Offer>();
  readonly sortedItems = input.required<OfferItem[]>();
  readonly cartItems = input.required<CheckoutItem[]>();
  readonly totalItems = input.required<number>();
  readonly totalPrice = input.required<number>();

  readonly addToCart = output<OfferItem>();
  readonly increaseQuantity = output<number>();
  readonly decreaseQuantity = output<number>();
  readonly itemCounterChange = output<{ item: OfferItem; newValue: number; field: CounterField }>();
  readonly editCartItemNotes = output<CheckoutItem>();
  readonly placeOrder = output<void>();
  readonly openChat = output<void>();
  readonly openSellerProfile = output<string>();
  readonly navigateToMobileCart = output<void>();

  isItemInCart(itemId: number): boolean {
    return this.cartItems().some((c) => c.item.item_id === itemId);
  }

  getItemQuantity(itemId: number): number {
    return this.cartItems().find((c) => c.item.item_id === itemId)?.quantity || 0;
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

  onItemCounterChange(item: OfferItem, newValue: number, field: CounterField) {
    const current = this.getItemQuantity(item.item_id);

    if (newValue > current) {
      this.increaseQuantity.emit(item.item_id);
    } else if (newValue < current) {
      if (current === 1) {
        field.value.set(1);
      }
      this.decreaseQuantity.emit(item.item_id);
    }
  }
}
