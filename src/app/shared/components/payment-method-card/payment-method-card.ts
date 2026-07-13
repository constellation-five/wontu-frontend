import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BankLogo } from '../bank-logo/bank-logo';

export interface PaymentMethodData {
  payment_method_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
}

@Component({
  selector: 'payment-method-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, BankLogo],
  templateUrl: './payment-method-card.html',
  styleUrl: './payment-method-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodCard {
  private snackBar = inject(MatSnackBar);
  
  method = input.required<PaymentMethodData>();
  showEdit = input<boolean>(true);
  isMobile = input<boolean>(false);
  
  edit = output<PaymentMethodData>();

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', {
        duration: 3000,
      });
    });
  }
}
