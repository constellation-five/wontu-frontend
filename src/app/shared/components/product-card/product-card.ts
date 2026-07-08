import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CategoryLabelComponent } from './../category-label/category-label';

export type ProductCardStockVariant = 'default' | 'low';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss'],
  standalone: true,
  imports: [MatCardModule, CategoryLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  imageUrl = input<string>('');
  title = input.required<string>();
  category = input<string>('');
  subtitle = input<string>('');
  price = input.required<string>();
  stockText = input.required<string>();
  stockVariant = input<ProductCardStockVariant>('default');
  clickable = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });

  cardClick = output<void>();

  onCardClick() {
    if (this.clickable()) {
      this.cardClick.emit();
    }
  }
}
