import { 
    ChangeDetectionStrategy, 
    Component, 
    input, 
    output, 
    booleanAttribute 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryLabelComponent } from '../../../shared/components/category-label/category-label';

@Component({
  selector: 'app-request-card',
  templateUrl: './request-card.html',
  styleUrls: ['./request-card.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, CategoryLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestCard {
  title = input.required<string>();
  subtitle = input.required<string>();
  category = input<'food' | 'other'>('other');
  votes = input<number>(0);
  
  hasVoted = input(false, { transform: booleanAttribute });
  isOwner = input(false, { transform: booleanAttribute });

  editClick = output<void>();
  createOfferClick = output<void>();
  voteClick = output<void>();

  isLoggedIn = input<boolean>(false);

  onEdit(event: Event) {
    event.stopPropagation();
    this.editClick.emit();
  }

  onCreateOffer(event: Event) {
    event.stopPropagation();
    this.createOfferClick.emit();
  }

  onVote(event: Event) {
    event.stopPropagation();
    this.voteClick.emit();
  }
}