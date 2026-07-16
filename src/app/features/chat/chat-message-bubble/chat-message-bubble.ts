import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../core/chat.service';
import { NaturalDateTimePipe } from '../../../shared/pipes/natural-date-time.pipe';
import { TimeTickService } from '../../../core/time-tick.service';

@Component({
  selector: 'chat-message-bubble',
  standalone: true,
  imports: [CommonModule, NaturalDateTimePipe],
  templateUrl: './chat-message-bubble.html',
  styleUrl: './chat-message-bubble.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Lets the parent's list styling give grouped (no-header) messages a
    // tighter gap than messages that start a new group.
    '[class.grouped]': '!showInfo()',
  },
})
export class ChatMessageBubble {
  protected readonly timeTick = inject(TimeTickService);

  message = input.required<ChatMessage>();
  currentUserId = input<string | null>(null);
  /** Label shown alongside the header when this message is whispered to a single recipient. */
  targetLabel = input<string | null>(null);
  /** Whether to show the name/time/scope header above this message (grouping is handled by the parent). */
  showInfo = input(true);

  avatarClick = output<string>();

  readonly isOwn = computed(() => {
    const sender = this.message().sender;
    return !!sender && sender.user_id === this.currentUserId();
  });

  /** Whispered messages get a distinct color regardless of who sent them. */
  readonly isScoped = computed(() => this.message().target_user_id !== null);

  onAvatarClick(): void {
    const sender = this.message().sender;
    if (sender) {
      this.avatarClick.emit(sender.user_id);
    }
  }
}
