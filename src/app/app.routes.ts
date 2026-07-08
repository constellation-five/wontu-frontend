import { Routes } from '@angular/router';
import { OfferShowPage } from './features/offer/index/offer-show';
import { OfferDetailPage } from './features/offer/detail/offer-detail-page';
import { OfferMobileCart } from './features/offer/detail/offer-mobile-cart';
import { OfferChatPage } from './features/offer/chat/offer-chat';
import { ProfilePage } from './features/profile/profile-page';
import { RequestPage } from './features/request/request-page';
import { PaymentMethod } from './features/payment-method/payment-method-page';
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
            component: OfferShowPage,
            title: 'Offers',
            data: { hideHeader: true },
          },
          { 
            path: 'create', 
            loadComponent: () => import('./features/offer/create/offer-create'),
            title: 'Create Offer',
          },
          {
            path: ':id',
            component: OfferDetailPage,
            title: 'Offer Detail',
            data: { hideBottomBar: true },
          },
          {
            path: ':id/mobile-cart',
            component: OfferMobileCart,
            title: 'Cart',
            data: { hideBottomBar: true },
          },
          {
            path: ':id/chat',
            component: OfferChatPage,
            title: 'Chat',
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
        loadComponent: () => import('./features/history/history-page').then(m => m.HistoryPage),
        canActivate: [authGuard],
        title: 'Order History',
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
            component: PaymentMethod,
            title: 'Payment Methods',
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'offers' },
];
