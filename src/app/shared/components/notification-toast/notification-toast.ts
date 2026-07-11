import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NotificationService } from '../../../core/notification.service';
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
  protected readonly autoDismissMs = AUTO_DISMISS_MS;

  protected readonly items = computed<NotificationStackItem[]>(() =>
    this.notificationService.toasts().map((toast) => ({ id: toast.toastId, notification: toast.notification })),
  );

  onDismissed(id: string): void {
    this.notificationService.dismissToast(id);
  }
}
