import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { EchoService } from './echo.service';
import { MessageTemplateService } from './message-template.service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: NotificationType;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface ToastItem {
  toastId: string;
  notification: AppNotification;
}

interface ApiNotification {
  id: string;
  template_key?: string;
  params?: Record<string, any>;
  title?: string;
  description?: string;
  icon: string;
  type: NotificationType;
  action_url?: string;
  read: boolean;
  created_at: string;
}

function toAppNotification(raw: ApiNotification, messageTemplateService: MessageTemplateService): AppNotification {
  let title = raw.title ?? 'Notification';
  let description = raw.description ?? '';

  if (raw.template_key) {
    const resolved = messageTemplateService.resolveTemplate(raw.template_key, raw.params);
    title = resolved.title;
    description = resolved.description;
  }

  return {
    id: raw.id,
    title,
    description,
    icon: raw.icon,
    type: raw.type,
    actionUrl: raw.action_url,
    read: raw.read,
    createdAt: raw.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly echoService = inject(EchoService);
  private readonly router = inject(Router);
  private readonly messageTemplateService = inject(MessageTemplateService);

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
      
      let title = (raw['title'] as string) ?? 'Notification';
      let description = (raw['description'] as string) ?? '';
      
      if (raw['template_key']) {
        const resolved = this.messageTemplateService.resolveTemplate(
          raw['template_key'] as string,
          (raw['params'] as Record<string, any>) ?? {}
        );
        title = resolved.title;
        description = resolved.description;
      }

      const notification: AppNotification = {
        id: raw['id'] as string,
        title,
        description,
        icon: (raw['icon'] as string) ?? 'notifications',
        type: (raw['notification_type'] as NotificationType) ?? 'info',
        actionUrl: raw['action_url'] as string | undefined,
        read: false,
        createdAt: new Date().toISOString(),
      };

      this._unreadCount.update((c) => c + 1);

      if (this.listLoaded) {
        this._notifications.update((prev) => [notification, ...prev]);
      }

      // Do not display the toast if the user is already viewing the target chat room
      const currentPath = this.router.url.split('?')[0];
      if (
        notification.actionUrl &&
        notification.actionUrl.endsWith('/chat') &&
        currentPath === notification.actionUrl
      ) {
        return;
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
          this._notifications.set(notifications.map(n => toAppNotification(n, this.messageTemplateService)));
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
  }
}
