import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatParticipant } from '../../../core/chat.service';

@Component({
  selector: 'chat-information-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-information-pane.html',
  styleUrl: './chat-information-pane.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInformationPane {
  owner = input<Omit<ChatParticipant, 'role' | 'left_at'> | null>(null);
  participants = input.required<ChatParticipant[]>();

  memberClick = output<string>();

  /** Members list excludes the owner (shown separately) and anyone who has left. */
  readonly members = computed(() =>
    this.participants().filter((p) => p.role !== 'owner' && p.left_at === null),
  );
}
