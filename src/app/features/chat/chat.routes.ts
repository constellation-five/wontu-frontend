import { Routes } from '@angular/router';
import { OfferChatPage } from './group/offer-chat-page';

export const CHAT_ROUTES: Routes = [
  {
    path: 'offers/:id/chat',
    component: OfferChatPage,
    title: 'Chat',
    data: { hideBottomBar: true },
  },
];
