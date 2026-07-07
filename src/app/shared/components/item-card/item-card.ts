import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OfferItem } from '../../../core/offer.service';

@Component({
  selector: 'app-item-card',
  templateUrl: './item-card.html',
  styleUrls: ['./item-card.scss'],
  standalone: true,
  imports: [
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemCardComponent {
  item = input.required<OfferItem>();
  isInCart = input<boolean>(false);
  quantity = input<number>(0);
  isOutOfStock = input<boolean>(false);

  onAdd = output<OfferItem>();
  onIncrease = output<number>();
  onDecrease = output<number>();

  private static readonly NEW_ITEM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

  get stockRemaining(): number {
    const currentItem = this.item();
    return currentItem.slot - currentItem.current_slot;
  }

  get isNew(): boolean {
    const createdAt = new Date(this.item().created_at).getTime();
    if (isNaN(createdAt)) return false;
    return Date.now() - createdAt < ItemCardComponent.NEW_ITEM_WINDOW_MS;
  }

  get isMaxQuantity(): boolean {
    return this.quantity() >= this.stockRemaining;
  }

  handleAdd() {
    this.onAdd.emit(this.item());
  }

  handleIncrease() {
    this.onIncrease.emit(this.item().item_id);
  }

  handleDecrease() {
    this.onDecrease.emit(this.item().item_id);
  }
}
