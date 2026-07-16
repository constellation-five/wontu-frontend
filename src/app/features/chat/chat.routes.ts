import { Routes } from '@angular/router';
import { OfferChatPage } from './group/offer-chat-page';
import { PrivateChatPage } from './private/private-chat-page';
import { authGuard } from '../../core/auth.guard';

export const CHAT_ROUTES: Routes = [
  {
    path: 'offers/:id/chat',
    component: OfferChatPage,
    title: 'Chat',
    data: { hideBottomBar: true },
  },
  {
    path: 'chat/:conversationId',
    component: PrivateChatPage,
    title: 'Chat',
    canActivate: [authGuard],
    data: { hideBottomBar: true },
  },
];
