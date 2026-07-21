import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ChatService } from './chat.service';

/** Pre-loads a private conversation by conversationId so the chat page doesn't flash the header. */
export const privateChatResolver: ResolveFn<boolean> = (route) => {
  const chatService = inject(ChatService);
  const id = route.paramMap.get('conversationId');
  if (!id) return of(false);

  return chatService.openConversation(id).pipe(catchError(() => of(false)));
};

/** Pre-loads an offer conversation by offerId so the chat page doesn't flash the header. */
export const offerChatResolver: ResolveFn<boolean> = (route) => {
  const chatService = inject(ChatService);
  const id = route.paramMap.get('id');
  if (!id) return of(false);

  return chatService.openOfferConversation(id).pipe(catchError(() => of(false)));
};
