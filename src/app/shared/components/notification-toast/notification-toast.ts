import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../../../core/notification.service';
import { NotificationStack, NotificationStackItem } from '../notification-stack/notification-stack';

const AUTO_DISMISS_MS = 5000;

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [NotificationStack],
  templateUrl: './notification-toast.html',
  styleUrl: './notification-toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToast {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  protected readonly autoDismissMs = AUTO_DISMISS_MS;

  protected readonly items = computed<NotificationStackItem[]>(() =>
    this.notificationService.toasts().map((toast) => ({ id: toast.toastId, notification: toast.notification })),
  );

  onDismissed(id: string): void {
    this.notificationService.dismissToast(id);
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
    
    // Dismiss toast immediately upon clicking
    const toastId = this.items().find(i => i.notification.id === notification.id)?.id;
    if (toastId) {
      this.notificationService.dismissToast(toastId);
    }
    
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }
}
