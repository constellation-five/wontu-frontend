import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
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
})
export class NotificationBellComponent {
  @Input() notifications: Notification[] = [];
  @Output() markAllAsRead = new EventEmitter<void>();
  @Output() markAsRead = new EventEmitter<string>();

  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  get hasNotifications(): boolean {
    return this.unreadCount > 0;
  }

  onMarkAllAsRead() {
    this.markAllAsRead.emit();
  }

  onMarkAsRead(notificationId: string) {
    this.markAsRead.emit(notificationId);
  }

  getUnreadBadgeContent(): string {
    const count = this.unreadCount;
    return count > 9 ? '9+' : count.toString();
  }
}
