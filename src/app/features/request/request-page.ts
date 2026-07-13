import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';

@Component({
  selector: 'request-page',
  templateUrl: './request-page.html',
  styleUrl: './request-page.scss',
  imports: [NotificationBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestPage {}
