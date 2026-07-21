import { Routes } from '@angular/router';
import { OfferChatPage } from './group/offer-chat-page';
import { PrivateChatPage } from './private/private-chat-page';
import { authGuard } from '../../core/auth.guard';
import { offerResolver } from '../../core/offer.resolver';
import { offerChatResolver, privateChatResolver } from '../../core/chat.resolver';

export const CHAT_ROUTES: Routes = [
  {
    path: 'offers/:id/chat',
    component: OfferChatPage,
    title: $localize`Chat`,
    resolve: { offer: offerResolver, chat: offerChatResolver },
    data: { hideBottomBar: true },
  },
  {
    path: 'chat/:conversationId',
    component: PrivateChatPage,
    title: $localize`Chat`,
    canActivate: [authGuard],
    resolve: { chat: privateChatResolver },
    data: { hideBottomBar: true },
  },
];
