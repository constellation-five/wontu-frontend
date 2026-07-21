import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CategoryLabelComponent } from '../../../shared/components/category-label/category-label';
import { RupiahFormatPipe } from '../../../shared/pipes/rupiah-format.pipe';

@Component({
  selector: 'app-activity-card',
  templateUrl: './activity-card.html',
  styleUrls: ['./activity-card.scss'],
  standalone: true,
  imports: [MatCardModule, MatIconModule, CategoryLabelComponent, RupiahFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCardComponent {
  type = input.required<'Order' | 'Offer'>();
  category = input.required<string>();
  merchantName = input.required<string>();
  locationLabel = input.required<string>();
  date = input.required<string>();
  statusText = input.required<string>();
  statusColor = input.required<string>();
  imageUrl = input<string>('');
  totalPrice = input<number>(0);
  isHistory = input<boolean>(false);
  isRated = input<boolean>(false);
  
  rateClick = output<void>();


  cardClick = output<void>();

  onCardClick() {
    this.cardClick.emit();
  }
  
  onRateClick(event: Event) {
    event.stopPropagation();
    this.rateClick.emit();
  }
}
