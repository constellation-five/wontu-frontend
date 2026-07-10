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
import { ButtonSizeDirective } from '../../directives/button/button-size';
import { NaturalDateTimePipe } from '../../pipes/natural-date-time.pipe';

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
    ButtonSizeDirective,
    NaturalDateTimePipe,
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
}
