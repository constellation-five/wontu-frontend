import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { BankLogoComponent } from '../bank-logo/bank-logo';

export interface PaymentMethodData {
  payment_method_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
}

@Component({
  selector: 'payment-method-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, BankLogoComponent],
  templateUrl: './payment-method-card.html',
})
export class PaymentMethodCardComponent {
  @Input({ required: true }) method!: PaymentMethodData;

  /** Tampilkan tombol edit atau tidak. Default true. */
  @Input() showEdit: boolean = true;

  @Output() edit = new EventEmitter<PaymentMethodData>();

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  }
}
