import { ChangeDetectionStrategy, Component, input, output, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  notifications = input<Notification[]>([]);
  markAllAsRead = output<void>();
  markAsRead = output<string>();

  menuTrigger = viewChild<MatMenuTrigger>(MatMenuTrigger);

  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  hasNotifications = computed(() => this.unreadCount() > 0);

  onMarkAllAsRead() {
    this.markAllAsRead.emit();
  }

  onMarkAsRead(notificationId: string) {
    this.markAsRead.emit(notificationId);
  }

  getUnreadBadgeContent(): string {
    const count = this.unreadCount();
    return count > 9 ? '9+' : count.toString();
  }
}
