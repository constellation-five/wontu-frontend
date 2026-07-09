import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { EchoService } from './echo.service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface ToastItem {
  toastId: string;
  notification: AppNotification;
}

interface ApiNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

function toAppNotification(raw: ApiNotification): AppNotification {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    icon: raw.icon,
    type: raw.type,
    read: raw.read,
    createdAt: raw.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly echoService = inject(EchoService);

  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _toasts = signal<ToastItem[]>([]);
  private listLoaded = false;

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly toasts = this._toasts.asReadonly();

  /** Called after auth — fetches initial unread count and starts Reverb subscription. */
  initialize(userId: string): void {
    this.http
      .get<{ count: number }>(`${environment.api}/notifications/unread-count`)
      .subscribe({ next: ({ count }) => this._unreadCount.set(count) });

    this.echoService.listenToUserNotifications(userId, (data: unknown) => {
      const raw = data as Record<string, unknown>;
      const notification: AppNotification = {
        id: raw['id'] as string,
        title: raw['title'] as string,
        description: raw['description'] as string,
        icon: (raw['icon'] as string) ?? 'notifications',
        type: (raw['notification_type'] as NotificationType) ?? 'info',
        read: false,
        createdAt: new Date().toISOString(),
      };

      this._unreadCount.update((c) => c + 1);

      if (this.listLoaded) {
        this._notifications.update((prev) => [notification, ...prev]);
      }

      this.pushToast(notification);
    });
  }

  /** Called when the bell panel opens — fetches full list and marks all as read. */
  loadNotifications(): void {
    this._isLoading.set(true);
    this.http
      .get<ApiNotification[]>(`${environment.api}/notifications`)
      .subscribe({
        next: (notifications) => {
          this._notifications.set(notifications.map(toAppNotification));
          this._isLoading.set(false);
          this.listLoaded = true;
          if (this._unreadCount() > 0) {
            this.markAllAsRead();
          }
        },
        error: () => this._isLoading.set(false),
      });
  }

  markAsRead(id: string): void {
    this.http
      .patch(`${environment.api}/notifications/${id}/mark-read`, {})
      .subscribe({
        next: () => {
          this._notifications.update((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
          this._unreadCount.update((c) => Math.max(0, c - 1));
        },
      });
  }

  markAllAsRead(): void {
    this.http.post(`${environment.api}/notifications/mark-all-read`, {}).subscribe({
      next: () => {
        this._notifications.update((prev) => prev.map((n) => ({ ...n, read: true })));
        this._unreadCount.set(0);
      },
    });
  }

  deleteNotification(id: string): void {
    this.http.delete(`${environment.api}/notifications/${id}`).subscribe({
      next: () => {
        const wasUnread = this._notifications().find((n) => n.id === id)?.read === false;
        this._notifications.update((prev) => prev.filter((n) => n.id !== id));
        if (wasUnread) {
          this._unreadCount.update((c) => Math.max(0, c - 1));
        }
      },
    });
  }

  clearAll(): void {
    this.http.delete(`${environment.api}/notifications`).subscribe({
      next: () => {
        this._notifications.set([]);
        this._unreadCount.set(0);
      },
    });
  }

  dismissToast(toastId: string): void {
    this._toasts.update((prev) => prev.filter((t) => t.toastId !== toastId));
  }

  teardown(): void {
    this.echoService.disconnect();
    this._notifications.set([]);
    this._unreadCount.set(0);
    this._toasts.set([]);
    this.listLoaded = false;
  }

  private pushToast(notification: AppNotification): void {
    const toastId = crypto.randomUUID();
    this._toasts.update((prev) => [{ toastId, notification }, ...prev].slice(0, 3));
    setTimeout(() => this.dismissToast(toastId), 5000);
  }
}
