import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    BankLogo,
  ],
  templateUrl: './payment-method-card.html',
  styleUrl: './payment-method-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodCard {
  private snackBar = inject(MatSnackBar);

  method = input.required<PaymentMethodData>();
  showEdit = input<boolean>(true);
  isMobile = input<boolean>(false);
  showAccountNumber = input(true, { transform: booleanAttribute });

  /** When set, renders a selection checkbox instead of the edit button (used by the seller offer-creation form). */
  selectable = input(false, { transform: booleanAttribute });
  selected = input(false, { transform: booleanAttribute });
  selectedChange = output<boolean>();

  edit = output<PaymentMethodData>();

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open($localize`Copied to clipboard.`, $localize`Close`, {
        duration: 3000,
      });
    });
  }
}
