import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe } from '@angular/common';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { CartItemCard } from '../../../shared/components/cart-item-card/cart-item-card';
import { TimelineBar, TimelineItem } from '../../../shared/components/timeline-bar/timeline-bar';
import { FileDropUpload } from '../../../shared/components/file-drop-upload/file-drop-upload';
import { UploadFileCard } from '../../../shared/components/upload-file-card/upload-file-card';
import {
  PaymentMethodCard,
  PaymentMethodData,
} from '../../../shared/components/payment-method-card/payment-method-card';
import { ButtonSizeDirective, ButtonColorDirective } from '../../../shared/directives/button';
import { Offer, CheckoutItem, MyOrder } from '../../../core/offer.service';

@Component({
  selector: 'app-offer-checkout-view',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    PaneComponent,
    CartItemCard,
    TimelineBar,
    FileDropUpload,
    UploadFileCard,
    PaymentMethodCard,
    ButtonSizeDirective,
    ButtonColorDirective,
    DecimalPipe,
  ],
  templateUrl: './offer-checkout-view.html',
  styleUrls: ['./offer-checkout-view.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferCheckoutView {
  readonly offer = input.required<Offer>();
  readonly myOrder = input<MyOrder | null>(null);
  readonly cartItems = input.required<CheckoutItem[]>();
  readonly totalPrice = input.required<number>();
  readonly paymentMethods = input.required<PaymentMethodData[]>();
  readonly dummyPaymentMethod = input.required<PaymentMethodData>();
  readonly proofOfPayment = input<File | null>(null);
  readonly uploadProgress = input<number | null>(null);
  readonly progressItems = input.required<TimelineItem[]>();
  readonly currentProgressStep = input.required<number>();
  readonly isOfferClosed = input<boolean>(false);

  readonly openChat = output<void>();
  readonly editOrder = output<void>();
  readonly cancelOrder = output<void>();
  readonly completePayment = output<void>();
  readonly proofOfPaymentChange = output<File | null>();
  readonly openSellerProfile = output<string>();
  readonly openRating = output<void>();

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) +
      ', ' +
      date
        .toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        .replace('am', 'AM')
        .replace('pm', 'PM')
    );
  }
}
