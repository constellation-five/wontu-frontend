import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CategoryLabelComponent } from '../category-label/category-label';

@Component({
  selector: 'app-merchant-card',
  templateUrl: './merchant-card.html',
  styleUrls: ['./merchant-card.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatCardModule,
    CategoryLabelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MerchantCardComponent {
  merchantName = input.required<string>();
  category = input.required<string>();
  arrivalTime = input.required<string>();
  priceRange = input.required<string>();
  stockLeft = input.required<number>();
  imageUrl = input<string>('');
  offerId = input.required<number>();

  cardClick = output<number>();

  onCardClick() {
    this.cardClick.emit(this.offerId());
  }
}
