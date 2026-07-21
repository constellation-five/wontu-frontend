import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderService } from '../../../core/page-header.service';
import { AuthService } from '../../../core/auth.service';
import { ChatService } from '../../../core/chat.service';
import { BreakpointService } from '../../../core/breakpoint.service';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { ChatThread } from '../chat-thread/chat-thread';
import { UserProfileDialog } from '../../../shared/components/dialog/user-profile-dialog';

@Component({
  selector: 'private-chat-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PaneComponent, ChatThread],
  templateUrl: './private-chat-page.html',
  styleUrls: ['./private-chat-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateChatPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  protected readonly chatService = inject(ChatService);
  protected readonly breakpointService = inject(BreakpointService);

  /** The other side of this 1:1 conversation (there are always exactly two participants). */
  readonly otherParticipant = computed(() => {
    const conversation = this.chatService.conversation();
    const userId = this.authService.user()?.user_id;
    if (!conversation) return null;
    return conversation.participants.find((p) => p.user_id !== userId) ?? null;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('conversationId');
    if (!id) {
      this.router.navigate(['/offers']);
    }

    effect(() => {
      this.pageHeaderService.forceTopBarSolid.set(true);
      this.pageHeaderService.customBackAction.set(() => this.goBack());
    });
  }

  ngOnInit() {
    const other = this.otherParticipant();
    if (other) {
      this.pageHeaderService.setTitle(other.name);
    }
  }

  goBack(): void {
    this.location.back();
  }

  onAvatarClick(userId: string): void {
    if (userId === this.authService.user()?.user_id) {
      this.router.navigate(['/profile']);
      return;
    }

    this.dialog.open(UserProfileDialog, {
      width: '348px',
      data: { userId },
    });
  }

  ngOnDestroy(): void {
    this.chatService.closeConversation();
    this.pageHeaderService.showHeader.set(true);
    this.pageHeaderService.forceTopBarSolid.set(false);
    this.pageHeaderService.customBackAction.set(null);
  }
}
