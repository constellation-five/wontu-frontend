import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/auth.service';
import { ChatMessage, ChatService } from '../../../core/chat.service';
import { ChatMessageBubble } from '../chat-message-bubble/chat-message-bubble';
import { ButtonSizeDirective, IconButtonVariantDirective } from '../../../shared/directives/button';

interface ScopeOption {
  label: string;
  value: string;
}

interface DisplayMessage {
  message: ChatMessage;
  showInfo: boolean;
}

const ALL_MEMBERS = '';
const GROUP_GAP_MS = 60_000;
const INFO_REPEAT_MS = 5 * 60_000;

@Component({
  selector: 'chat-thread',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ChatMessageBubble,
    IconButtonVariantDirective,
    ButtonSizeDirective,
  ],
  templateUrl: './chat-thread.html',
  styleUrl: './chat-thread.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatThread implements AfterViewChecked {
  private readonly authService = inject(AuthService);
  protected readonly chatService = inject(ChatService);

  /** Only offer-group chats show the "To:" whisper-scope selector. */
  isGroup = input(false);

  avatarClick = output<string>();

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;
  private lastMessageCount = 0;

  readonly currentUserId = computed(() => this.authService.user()?.user_id ?? null);
  readonly conversation = this.chatService.conversation;
  readonly messages = this.chatService.messages;
  readonly isLoading = this.chatService.isLoading;

  readonly bodyText = signal('');
  readonly selectedImage = signal<File | null>(null);
  readonly selectedTarget = signal<string>(ALL_MEMBERS);
  readonly isSending = signal(false);

  readonly imagePreviewUrl = computed(() => {
    const file = this.selectedImage();
    return file ? URL.createObjectURL(file) : null;
  });

  /** Whether the authenticated user is the owner (seller) of this conversation. */
  readonly isOwner = computed(() => {
    const conversation = this.conversation();
    const userId = this.currentUserId();
    return !!conversation && !!userId && conversation.owner?.user_id === userId;
  });

  readonly scopeOptions = computed<ScopeOption[]>(() => {
    const conversation = this.conversation();
    const userId = this.currentUserId();
    if (!conversation || !userId) return [];

    const everyone: ScopeOption = { label: 'Everyone', value: ALL_MEMBERS };

    if (this.isOwner()) {
      const buyers = conversation.participants.filter(
        (p) => p.role !== 'owner' && p.left_at === null && p.user_id !== userId,
      );
      return [everyone, ...buyers.map((b) => ({ label: b.name, value: b.user_id }))];
    }

    if (conversation.owner) {
      return [everyone, { label: 'Seller', value: conversation.owner.user_id }];
    }

    return [everyone];
  });

  readonly canSend = computed(
    () => (this.bodyText().trim().length > 0 || this.selectedImage() !== null) && !this.isSending(),
  );

  /**
   * Groups consecutive text messages from the same sender + scope, showing
   * the name/time/scope header only on the first message of each group. A
   * new header starts whenever the sender or scope changes, more than 60s
   * passed since the previous message, more than 5 minutes passed since a
   * header was last shown, or a system message interrupts the run.
   */
  readonly displayMessages = computed<DisplayMessage[]>(() => {
    const msgs = this.messages();
    const result: DisplayMessage[] = [];

    let prevSenderId: string | null | undefined;
    let prevScope: string | null = null;
    let prevTimestamp: number | null = null;
    let lastInfoShownAt: number | null = null;

    for (const message of msgs) {
      if (message.type === 'system') {
        result.push({ message, showInfo: false });
        prevSenderId = undefined;
        prevScope = null;
        prevTimestamp = null;
        lastInfoShownAt = null;
        continue;
      }

      const senderId = message.sender?.user_id ?? null;
      const scope = message.target_user_id ?? null;
      // Optimistic (not-yet-confirmed) messages have no created_at yet —
      // treat them as "now" for grouping purposes.
      const timestamp = message.created_at ? new Date(message.created_at).getTime() : Date.now();

      const contextChanged = prevSenderId === undefined || senderId !== prevSenderId || scope !== prevScope;
      const tooLongSincePrev = prevTimestamp === null || timestamp - prevTimestamp > GROUP_GAP_MS;
      const tooLongSinceInfo = lastInfoShownAt === null || timestamp - lastInfoShownAt > INFO_REPEAT_MS;

      const showInfo = contextChanged || tooLongSincePrev || tooLongSinceInfo;

      result.push({ message, showInfo });

      if (showInfo) {
        lastInfoShownAt = timestamp;
      }
      prevSenderId = senderId;
      prevScope = scope;
      prevTimestamp = timestamp;
    }

    return result;
  });

  targetLabelFor(targetUserId: string | null): string | null {
    if (!targetUserId) return null;
    const conversation = this.conversation();
    if (!conversation) return null;
    if (conversation.owner?.user_id === targetUserId) return 'Seller';
    return conversation.participants.find((p) => p.user_id === targetUserId)?.name ?? null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedImage.set(file);
    input.value = '';
  }

  clearSelectedImage(): void {
    this.selectedImage.set(null);
  }

  send(): void {
    const conversation = this.conversation();
    if (!conversation || !this.canSend()) return;

    const body = this.bodyText().trim();
    const image = this.selectedImage();
    const targetUserId = this.selectedTarget() || undefined;
    const user = this.authService.user();
    const sender = user ? { user_id: user.user_id, name: user.name, avatar: user.avatar } : null;

    // Clear the composer immediately — the message is already shown
    // optimistically, so there's no reason to wait on the backend.
    this.bodyText.set('');
    this.selectedImage.set(null);

    this.isSending.set(true);
    this.chatService
      .sendMessage(
        conversation.id,
        {
          body: body || undefined,
          image: image || undefined,
          targetUserId,
        },
        sender,
      )
      .subscribe({
        next: () => this.isSending.set(false),
        error: () => this.isSending.set(false),
      });
  }

  onAvatarClick(userId: string): void {
    this.avatarClick.emit(userId);
  }

  ngAfterViewChecked(): void {
    const count = this.messages().length;
    if (count !== this.lastMessageCount) {
      this.lastMessageCount = count;
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
