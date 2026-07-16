import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderService } from '../../../core/page-header.service';
import { OfferService } from '../../../core/offer.service';
import { Offer } from '../../../core/offer.service';
import { AuthService } from '../../../core/auth.service';
import { ChatService } from '../../../core/chat.service';
import { BreakpointService } from '../../../core/breakpoint.service';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { ChatThread } from '../chat-thread/chat-thread';
import { ChatInformationPane } from '../chat-information-pane/chat-information-pane';
import { ChatInfoDialog } from '../chat-info-dialog/chat-info-dialog';
import { UserProfileDialog } from '../../../shared/components/dialog/user-profile-dialog';

@Component({
  selector: 'offer-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    PaneComponent,
    ChatThread,
    ChatInformationPane,
  ],
  templateUrl: './offer-chat-page.html',
  styleUrls: ['./offer-chat-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferChatPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offerService = inject(OfferService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  protected readonly chatService = inject(ChatService);
  protected readonly breakpointService = inject(BreakpointService);

  offer = signal<Offer | null>(null);
  isLoading = signal<boolean>(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOffer(id);
    } else {
      this.router.navigate(['/offers']);
    }

    // The mobile layout renders its own local top bar in place of the app's
    // global top-bar/breadcrumbs, so the global header is only shown on desktop.
    effect(() => {
      this.pageHeaderService.showHeader.set(!this.breakpointService.isMobile());
    });

    effect(() => {
      this.pageHeaderService.setTitle(this.offer()?.merchant_name ?? 'Chat');
    });
  }

  loadOffer(id: string) {
    this.isLoading.set(true);
    this.offerService.getOfferById(id).subscribe({
      next: (data) => {
        this.offer.set(data);

        this.pageHeaderService.setBreadcrumbs([
          { label: 'Offers', route: '/offers' },
          { label: data.merchant_name, route: `/offers/${data.offer_id}` },
          { label: 'Chat' },
        ]);

        this.chatService.openOfferConversation(data.offer_id);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offers']);
      },
    });
  }

  goBack(): void {
    const offer = this.offer();
    if (offer) {
      this.router.navigate(['/offers', offer.offer_id]);
    } else {
      this.router.navigate(['/offers']);
    }
  }

  openInfoDialog(): void {
    const conversation = this.chatService.conversation();
    if (!conversation) return;

    this.dialog.open(ChatInfoDialog, {
      width: '360px',
      maxWidth: '90vw',
      data: { owner: conversation.owner, participants: conversation.participants },
      panelClass: 'chat-info-dialog-panel',
    });
  }

  onMemberClick(userId: string): void {
    if (userId === this.authService.user()?.user_id) {
      this.router.navigate(['/profile']);
      return;
    }

    this.dialog.open(UserProfileDialog, {
      data: { userId },
      panelClass: 'user-profile-dialog-panel',
    });
  }

  ngOnDestroy(): void {
    this.chatService.closeConversation();
    this.pageHeaderService.showHeader.set(true);
  }
}
