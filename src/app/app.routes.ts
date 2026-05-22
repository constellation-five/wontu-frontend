import { Routes } from '@angular/router';
import { HistoryPage } from './features/history/history-page';
import { OfferPage } from './features/offer/offer-list/offer-page';
import { OfferDetailPage } from './features/offer/offer-detail/offer-detail-page';
import { OfferCheckoutPage } from './features/offer/offer-checkout/offer-checkout';
import { OfferChatPage } from './features/offer/offer-chat/offer-chat';
import { ProfilePage } from './features/profile/profile-page';
import { RequestPage } from './features/request/request-page';
import { PaymentMethodPage } from './features/payment-method/payment-method-page';
import { MainLayout } from './shared/layouts/main-layout';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'offers' },
  { path: 'signin', loadComponent: () => import('./features/auth/sign-in-page') },
  { path: 'complete-signup', loadComponent: () => import('./features/auth/complete-sign-up-page') },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'offers',
        children: [
          {
            path: '',
            component: OfferPage,
            title: 'Offers',
            data: { hideHeader: true },
          },
          {
            path: ':id',
            component: OfferDetailPage,
            title: 'Offer Details',
          },
          {
            path: ':id/checkout',
            component: OfferCheckoutPage,
            title: 'Your Order',
            data: { breadcrumb: 'Checkout' },
          },
          {
            path: ':id/chat',
            component: OfferChatPage,
            title: 'Chat',
          },
          { 
            path: 'create', 
            loadComponent: () => import('./features/offer/offer-create/offer-create'),
            title: 'Create Offer',
          },
        ],
      },

      {
        path: 'requests',
        component: RequestPage,
        title: 'Requests',
        data: { hideHeader: true },
      },
      {
        path: 'history',
        component: HistoryPage,
        canActivate: [authGuard],
        title: 'History',
        data: { hideHeader: true },
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        title: 'Profile',
        data: { hideHeader: true },
        children: [
          { path: '', component: ProfilePage },
          {
            path: 'payment-method',
            component: PaymentMethodPage,
            title: 'Payment Method',
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'offers' },
];
