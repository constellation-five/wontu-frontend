import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CheckoutItem } from '../../../../core/offer.service';
import { CounterField } from '../../../../shared/components/counter-field/counter-field';
import { ButtonSizeDirective } from '../../../../shared/directives/button';
import { IconButtonVariantDirective } from '../../../../shared/directives/button/icon-button-variant';

@Component({
  selector: 'app-cart-item-card',
  standalone: true,
  imports: [
    DecimalPipe,
    MatIconModule,
    MatButtonModule,
    CounterField,
    ButtonSizeDirective,
    IconButtonVariantDirective,
  ],
  templateUrl: './cart-item-card.html',
  styleUrls: ['./cart-item-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemCard {
  item = input.required<CheckoutItem>();
  editable = input(false, { transform: booleanAttribute });

  increase = output<number>();
  decrease = output<number>();
  notesEdit = output<CheckoutItem>();

  onCounterChange(newValue: number, field: CounterField) {
    const current = this.item().quantity;
    const itemId = this.item().item.item_id;

    if (newValue > current) {
      this.increase.emit(itemId);
    } else if (newValue < current) {
      if (current === 1) {
        // Decreasing past 1 opens a remove-confirmation dialog upstream rather
        // than actually changing the quantity, so snap the field back visually.
        field.value.set(1);
      }
      this.decrease.emit(itemId);
    }
  }
}
