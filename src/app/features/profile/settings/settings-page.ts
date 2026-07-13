import { ChangeDetectionStrategy, Component, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { BREAKPOINTS } from '../../../core/constants';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  push: boolean;
  email: boolean;
}

@Component({
  selector: 'settings-page',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    PaneComponent,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private router = inject(Router);

  isMobile = signal(false);

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile.set(window.innerWidth <= BREAKPOINTS.MD);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  // Notification settings (UI only - no backend integration)
  notificationSettings = signal<NotificationSetting[]>([
    {
      id: 'new-offers',
      label: 'New Offers',
      description: 'These are notifications when new offers match your preferences or become available.',
      push: false,
      email: true,
    },
    {
      id: 'offer-updates',
      label: 'Offer Updates',
      description: 'These are notifications about price drops, status changes, or important updates on offers you follow.',
      push: false,
      email: false,
    },
    {
      id: 'expiring-offers',
      label: 'Expiring Offers',
      description: 'These are reminders before an active offer\'s period or availability ends.',
      push: false,
      email: false,
    },
    {
      id: 'new-messages',
      label: 'New Messages',
      description: 'These are notifications for direct messages and active discussions about offers or requests.',
      push: false,
      email: true,
    },
    {
      id: 'account-activity',
      label: 'Account Activity',
      description: 'These are alerts for logins from new devices, profile changes, or essential security.',
      push: false,
      email: false,
    },
  ]);

  selectedLanguage = signal('english');
  darkMode = signal(false);

  languages = [
    { value: 'english', label: 'English' },
    { value: 'indonesian', label: 'Indonesian' },
  ];

  // UI-only toggle handlers (no backend)
  togglePush(settingId: string) {
    this.notificationSettings.update(settings =>
      settings.map(s =>
        s.id === settingId ? { ...s, push: !s.push } : s
      )
    );
  }

  toggleEmail(settingId: string) {
    this.notificationSettings.update(settings =>
      settings.map(s =>
        s.id === settingId ? { ...s, email: !s.email } : s
      )
    );
  }

  toggleDarkMode() {
    this.darkMode.update(mode => !mode);
  }

  changeLanguage(language: string) {
    this.selectedLanguage.set(language);
  }
}
