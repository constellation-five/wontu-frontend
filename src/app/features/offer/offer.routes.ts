import { Routes } from '@angular/router';
import { OfferShowPage } from './index/offer-index-page';
import { OfferDetailPage } from './detail/offer-detail-page';
import { OfferMobileCart } from './detail/offer-mobile-cart';
import { OfferChatPage } from './chat/offer-chat-page';

export const OFFER_ROUTES: Routes = [
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
        loadComponent: () => import('./create/offer-create-page'),
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
];
