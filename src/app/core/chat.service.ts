import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError, switchMap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { EchoService } from './echo.service';
import { MessageTemplateService } from './message-template.service';

export interface ChatParticipant {
  user_id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'member';
  left_at: string | null;
}

export interface ConversationSummary {
  id: string;
  type: 'private' | 'offer_group';
  offer_id: number | null;
  offer_merchant_name: string | null;
  owner: Omit<ChatParticipant, 'role' | 'left_at'> | null;
  participants: ChatParticipant[];
  chat_open: boolean;
  chat_closes_at: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: { user_id: string; name: string; avatar: string } | null;
  target_user_id: string | null;
  body: string | null;
  image_url: string | null;
  type: 'text' | 'system';
  metadata: {
    template_key?: string;
    params?: Record<string, any>;
    title?: string;
    description?: string;
    icon?: string;
    notification_type?: string;
    chat_closes_at?: string;
  } | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly echoService = inject(EchoService);
  private readonly messageTemplateService = inject(MessageTemplateService);

  private readonly _conversation = signal<ConversationSummary | null>(null);
  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  readonly conversation = this._conversation.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  private currentUserId: string | null = null;
  /** Optimistic placeholder ids awaiting server confirmation, oldest first. */
  private pendingOptimisticIds: string[] = [];

  /** Called once after auth — starts listening for live chat messages. */
  initialize(userId: string): void {
    this.currentUserId = userId;
    this.echoService.listenToChatMessages(userId, (data: unknown) => {
      this.receiveMessage(data as ChatMessage);
    });
  }

  /** Find or create the persistent 1:1 conversation with another user (does not open it). */
  findOrCreatePrivateConversation(otherUserId: string): Observable<ConversationSummary> {
    return this.http.get<ConversationSummary>(
      `${environment.api}/conversations/private/${otherUserId}`,
    );
  }

  /** Loads (and lazily creates) the given offer's group conversation as the active conversation. */
  openOfferConversation(offerId: number | string): Observable<boolean> {
    return this.load(`${environment.api}/offers/${offerId}/conversation`);
  }

  /** Loads an already-known conversation id as the active conversation. */
  openConversation(conversationId: string): Observable<boolean> {
    return this.load(`${environment.api}/conversations/${conversationId}`);
  }

  /**
   * Sends a message, showing it in the UI immediately (with no timestamp,
   * since the server hasn't confirmed it yet) rather than waiting for the
   * round trip — the caller supplies `sender` since ChatService can't inject
   * AuthService itself without a circular dependency (AuthService already
   * depends on ChatService to start the live-message listener on login).
   */
  sendMessage(
    conversationId: string,
    payload: { body?: string; image?: File; targetUserId?: string },
    sender: { user_id: string; name: string; avatar: string } | null,
  ): Observable<ChatMessage> {
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    this.pendingOptimisticIds.push(optimisticId);

    this.appendMessage({
      id: optimisticId,
      conversation_id: conversationId,
      sender,
      target_user_id: payload.targetUserId ?? null,
      body: payload.body ?? null,
      image_url: payload.image ? URL.createObjectURL(payload.image) : null,
      type: 'text',
      metadata: null,
      // Empty until the server confirms — naturalDateTime renders '' for
      // this, so the bubble shows the sender's name but no time yet.
      created_at: '',
    });

    const formData = new FormData();
    if (payload.body) formData.append('body', payload.body);
    if (payload.image) formData.append('image', payload.image);
    if (payload.targetUserId) formData.append('target_user_id', payload.targetUserId);

    return this.http
      .post<ChatMessage>(`${environment.api}/conversations/${conversationId}/messages`, formData)
      .pipe(
        tap((message) => this.replaceMessage(optimisticId, message)),
        catchError((err) => {
          this.removeMessage(optimisticId);
          return throwError(() => err);
        }),
      );
  }

  /** Clears the active conversation — call when navigating away from a chat page. */
  closeConversation(): void {
    this._conversation.set(null);
    this._messages.set([]);
    this.pendingOptimisticIds = [];
  }

  teardown(): void {
    this.closeConversation();
  }

  private load(conversationUrl: string): Observable<boolean> {
    this._isLoading.set(true);
    this._messages.set([]);
    return this.http.get<ConversationSummary>(conversationUrl).pipe(
      tap((conversation) => this._conversation.set(conversation)),
      switchMap((conversation) =>
        this.http.get<ChatMessage[]>(`${environment.api}/conversations/${conversation.id}/messages`)
      ),
      tap((messages) => {
        this._messages.set(messages.map(m => this.processMessage(m)));
        this._isLoading.set(false);
      }),
      map(() => true),
      catchError(() => {
        this._conversation.set(null);
        this._isLoading.set(false);
        return throwError(() => new Error('Failed to load conversation'));
      })
    );
  }

  /**
   * Handles a message arriving over the live broadcast. If it's one of my
   * own messages and there's still a pending optimistic placeholder for it,
   * swap the placeholder in place (same array length, same position) rather
   * than appending — appending here would leave both the placeholder and the
   * real message visible simultaneously until the HTTP response's own
   * replaceMessage() call catches up a moment later, causing a visible
   * flicker/duplicate.
   */
  private receiveMessage(message: ChatMessage): void {
    const processed = this.processMessage(message);
    if (processed.sender?.user_id === this.currentUserId && this.pendingOptimisticIds.length > 0) {
      const tempId = this.pendingOptimisticIds.shift()!;
      this.replaceMessage(tempId, processed);
      return;
    }
    this.appendMessage(processed);
  }

  private processMessage(message: ChatMessage): ChatMessage {
    if (message.type === 'system' && message.metadata?.template_key) {
      const resolved = this.messageTemplateService.resolveTemplate(
        message.metadata.template_key,
        message.metadata.params || {}
      );
      message.metadata.title = resolved.title;
      message.metadata.description = resolved.description;
    }
    return message;
  }

  private appendMessage(message: ChatMessage): void {
    const current = this._conversation();
    if (!current || message.conversation_id !== current.id) {
      return;
    }
    this._messages.update((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message],
    );
  }

  /**
   * Swaps the optimistic placeholder for the server-confirmed message. The
   * real message may already have arrived via the live broadcast (handled by
   * receiveMessage above) before the HTTP response does — in that case this
   * just no-ops, since the placeholder is already gone and the real message
   * already present.
   */
  private replaceMessage(tempId: string, real: ChatMessage): void {
    const pendingIndex = this.pendingOptimisticIds.indexOf(tempId);
    if (pendingIndex !== -1) {
      this.pendingOptimisticIds.splice(pendingIndex, 1);
    }

    const current = this._conversation();
    if (!current || real.conversation_id !== current.id) {
      return;
    }
    this._messages.update((prev) => {
      const withoutPlaceholder = prev.filter((m) => m.id !== tempId);
      return withoutPlaceholder.some((m) => m.id === real.id)
        ? withoutPlaceholder
        : [...withoutPlaceholder, real];
    });
  }

  private removeMessage(id: string): void {
    const pendingIndex = this.pendingOptimisticIds.indexOf(id);
    if (pendingIndex !== -1) {
      this.pendingOptimisticIds.splice(pendingIndex, 1);
    }
    this._messages.update((prev) => prev.filter((m) => m.id !== id));
  }
}
