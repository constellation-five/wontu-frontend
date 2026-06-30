import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UserRole = 'buyer' | 'seller';
export type ProgressStyle = 'horizontal' | 'vertical';

export interface ProgressStep {
  label: string;
  completed: boolean;
  timeInfo?: string;
}

@Component({
  selector: 'offer-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-progress.html',
  styleUrls: ['./offer-progress.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferProgressComponent {
  role = input<UserRole>('buyer');
  currentStep = input<number>(0);
  style = input<ProgressStyle>('horizontal'); // NEW: choose layout style
  closingTime = input<string>('');
  arrivalTime = input<string>('');

  steps = computed<ProgressStep[]>(() => {
    const step = this.currentStep();
    const progressStyle = this.style();
    
    // For vertical style, include time info
    if (progressStyle === 'vertical') {
      const closing = this.formatTimeInfo(this.closingTime());
      const arrival = this.formatTimeInfo(this.arrivalTime());
      
      if (this.role() === 'buyer') {
        return [
          { label: 'Offer joined', completed: step >= 0 },
          { label: 'Offer closes at', completed: step >= 1, timeInfo: closing },
          { label: 'Payment made', completed: step >= 2 },
          { label: 'Payment confirmed', completed: step >= 3 },
          { label: 'Items arrive at', completed: step >= 4, timeInfo: arrival }
        ];
      } else {
        return [
          { label: 'Offer opened', completed: step >= 0 },
          { label: 'Offer closes at', completed: step >= 1, timeInfo: closing },
          { label: 'Payments confirmed', completed: step >= 2 },
          { label: 'Items arrive at', completed: step >= 3, timeInfo: arrival }
        ];
      }
    }
    
    // For horizontal style, no time info, original labels
    if (this.role() === 'buyer') {
      return [
        { label: 'Offer joined', completed: step >= 0 },
        { label: 'Offer closed', completed: step >= 1 },
        { label: 'Payment made', completed: step >= 2 },
        { label: 'Payment confirmed', completed: step >= 3 },
        { label: 'Items arrived', completed: step >= 4 }
      ];
    } else {
      return [
        { label: 'Offer opened', completed: step >= 0 },
        { label: 'Offer closed', completed: step >= 1 },
        { label: 'Payments confirmed', completed: step >= 2 },
        { label: 'Items arrived', completed: step >= 3 }
      ];
    }
  });

  private formatTimeInfo(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const hours = date.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    if (isToday) {
      return `Today, ${displayHours} ${period}`;
    }
    
    // Tomorrow check
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isTomorrow) {
      return `Tomorrow, ${displayHours} ${period}`;
    }
    
    // Other days
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}, ${displayHours} ${period}`;
  }
}
