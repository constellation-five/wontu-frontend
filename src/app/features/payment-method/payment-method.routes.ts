import { Routes } from '@angular/router';
import { PaymentMethod } from './payment-method-page';

export const PAYMENT_METHOD_ROUTES: Routes = [
  {
    path: 'payment-method',
    component: PaymentMethod,
    title: $localize`Payment Methods`,
    data: { forceTopBarSolid: true },
  },
];
