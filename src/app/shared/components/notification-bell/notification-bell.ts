import { ChangeDetectionStrategy, Component, inject, input, output, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, AppNotification } from '../../../core/notification.service';
import { IconButtonVariantDirective } from '../../directives/button/icon-button-variant';

export type { AppNotification };

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    IconButtonVariantDirective,
  ],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  protected readonly notificationService = inject(NotificationService);

  get badgeContent(): string {
    const count = this.notificationService.unreadCount();
    return count > 9 ? '9+' : String(count);
  }

  onPanelOpen(): void {
    this.notificationService.loadNotifications();
  }

  onDelete(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  onClearAll(): void {
    this.notificationService.clearAll();
  }

  typeIcon(type: AppNotification['type']): string {
    const icons: Record<AppNotification['type'], string> = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      error: 'error',
    };
    return icons[type];
  }

  timeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
