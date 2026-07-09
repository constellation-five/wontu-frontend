import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService, AppNotification } from '../../../core/notification.service';
import { IconButtonVariantDirective } from '../../directives/button/icon-button-variant';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, IconButtonVariantDirective],
  templateUrl: './notification-toast.html',
  styleUrl: './notification-toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToast {
  protected readonly notificationService = inject(NotificationService);

  dismiss(toastId: string): void {
    this.notificationService.dismissToast(toastId);
  }

  iconForType(type: AppNotification['type']): string {
    const icons: Record<AppNotification['type'], string> = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      error: 'error',
    };
    return icons[type];
  }
}
