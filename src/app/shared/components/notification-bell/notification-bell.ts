import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, AppNotification } from '../../../core/notification.service';
import { IconButtonVariantDirective } from '../../directives/button/icon-button-variant';
import { ButtonSizeDirective } from '../../directives/button/button-size';
import { NotificationStack, NotificationStackItem } from '../notification-stack/notification-stack';

export type { AppNotification };

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    IconButtonVariantDirective,
    ButtonSizeDirective,
    NotificationStack,
  ],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  protected readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly items = computed<NotificationStackItem[]>(() =>
    this.notificationService
      .notifications()
      .map((notification) => ({ id: notification.id, notification })),
  );

  protected readonly headerText = computed<string>(() =>
    this.notificationService.notifications().length === 0
      ? $localize`You have no notifications`
      : $localize`Notifications`,
  );

  protected readonly showTopFade = signal(false);
  protected readonly showBottomFade = signal(false);

  private listEl: HTMLElement | null = null;

  // A setter-based ViewChild: the list only exists in the DOM while there
  // are notifications (behind an @if), so this fires as it's created and
  // destroyed rather than only once at startup.
  @ViewChild('listEl') private set listElRef(ref: ElementRef<HTMLElement> | undefined) {
    this.listEl = ref?.nativeElement ?? null;
    this.updateFadeState(this.listEl);
  }

  constructor() {
    // The list's scrollHeight changes whenever items are added/removed, so
    // re-check the fade state then too (not just on manual scroll).
    effect(() => {
      this.items();
      queueMicrotask(() => this.updateFadeState(this.listEl));
    });
  }

  get badgeContent(): string {
    const count = this.notificationService.unreadCount();
    return count > 9 ? '9+' : String(count);
  }

  onPanelOpen(): void {
    this.notificationService.loadNotifications();
  }

  onListScroll(event: Event): void {
    this.updateFadeState(event.currentTarget as HTMLElement);
  }

  private updateFadeState(el: HTMLElement | null): void {
    if (!el) {
      return;
    }
    this.showTopFade.set(el.scrollTop > 2);
    this.showBottomFade.set(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }

  onDismissed(id: string): void {
    this.notificationService.deleteNotification(id);
  }

  onClearAll(): void {
    this.notificationService.clearAll();
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }
}
