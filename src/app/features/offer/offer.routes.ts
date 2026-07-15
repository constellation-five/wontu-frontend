import { Routes } from '@angular/router';
import { OfferShowPage } from './index/offer-index-page';
import { OfferPage } from './detail/offer-detail-page';
import { OfferMobileCart } from './detail/offer-mobile-cart';
import { OfferChatPage } from './chat/offer-chat-page';
import { authGuard } from '../../core/auth.guard';
import { sellerGuard } from '../../core/seller.guard';
import { offerResolver } from '../../core/offer.resolver';

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
        canActivate: [authGuard],
        data: { hideBottomBar: true },
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./create/offer-create-page'),
        title: 'Edit Offer',
        canActivate: [authGuard, sellerGuard],
        resolve: { offer: offerResolver },
        data: { hideBottomBar: true },
      },
      {
        path: ':id',
        component: OfferPage,
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
