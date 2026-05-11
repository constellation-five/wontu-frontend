import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UserRole = 'buyer' | 'seller';

export interface ProgressStep {
  label: string;
  completed: boolean;
}

@Component({
  selector: 'offer-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-progress.html',
  styleUrls: ['./offer-progress.scss']
})
export class OfferProgressComponent {
  @Input() role: UserRole = 'buyer';
  @Input() currentStep: number = 0; // 0-based index

  get steps(): ProgressStep[] {
    if (this.role === 'buyer') {
      return [
        { label: 'Offer joined', completed: this.currentStep >= 0 },
        { label: 'Offer closed', completed: this.currentStep >= 1 },
        { label: 'Payment made', completed: this.currentStep >= 2 },
        { label: 'Payment confirmed', completed: this.currentStep >= 3 },
        { label: 'Items arrived', completed: this.currentStep >= 4 }
      ];
    } else {
      return [
        { label: 'Offer opened', completed: this.currentStep >= 0 },
        { label: 'Offer closed', completed: this.currentStep >= 1 },
        { label: 'Payments confirmed', completed: this.currentStep >= 2 },
        { label: 'Items arrived', completed: this.currentStep >= 3 }
      ];
    }
  }
}
