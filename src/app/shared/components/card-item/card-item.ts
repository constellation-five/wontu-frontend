import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OfferItem } from '../../../core/offer';

export type CardItemVariant = 'detail' | 'home';

@Component({
  selector: 'card-item',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './card-item.html',
  styleUrls: ['./card-item.scss'],
})
export class CardItemComponent {
  @Input() variant: CardItemVariant = 'detail';
  @Input() item!: OfferItem;
  @Input() isInCart: boolean = false;
  @Input() quantity: number = 0;
  @Input() isOutOfStock: boolean = false;
  
  @Input() merchantName: string = '';
  @Input() category: string = 'Food';
  @Input() arrivalTime: string = '';
  @Input() priceRange: string = '';
  @Input() offerId: number = 0;
  
  @Output() onAdd = new EventEmitter<OfferItem>();
  @Output() onIncrease = new EventEmitter<number>();
  @Output() onDecrease = new EventEmitter<number>();
  @Output() onCardClick = new EventEmitter<number>();
  
  get stockRemaining(): number {
    return this.item.slot - this.item.current_slot;
  }
  
  get isMaxQuantity(): boolean {
    return this.quantity >= this.stockRemaining;
  }
  
  handleAdd() {
    this.onAdd.emit(this.item);
  }
  
  handleIncrease() {
    this.onIncrease.emit(this.item.item_id);
  }
  
  handleDecrease() {
    this.onDecrease.emit(this.item.item_id);
  }
  
  handleCardClick() {
    if (this.variant === 'home') {
      this.onCardClick.emit(this.offerId);
    }
  }
}
