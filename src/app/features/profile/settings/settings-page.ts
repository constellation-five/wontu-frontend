import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { PageHeaderService } from '../../../core/page-header.service';
import { environment } from '../../../../environments/environment';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  push: boolean;
  email: boolean;
}

interface SettingsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Record<string, { push: boolean; email: boolean }>;
    language: string;
    dark_mode: boolean;
  };
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
export class SettingsPage implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  private pageHeader = inject(PageHeaderService);
  isLoading = signal(true);

  ngOnInit() {
    this.pageHeader.setTitle('Settings');
    this.pageHeader.setBreadcrumbs([
      { label: 'Profile', route: '/profile' },
      { label: 'Settings', route: '/profile/settings' },
    ]);
    this.loadSettings();
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  // Notification settings metadata — keys must match backend's
  // App\Support\NotificationCategories, the single source of truth for
  // which notification classes each category actually gates.
  private notificationMetadata = [
    {
      id: 'new-orders',
      label: 'New orders & payments',
      description:
        'A buyer joins, places, updates, or cancels an order on one of your offers, or submits proof of payment.',
    },
    {
      id: 'offer-lifecycle',
      label: 'Offer status changes',
      description:
        "One of your offers closes automatically — either it reached its closing time or sold out.",
    },
    {
      id: 'offer-updates',
      label: 'Offer updates',
      description:
        "An offer you've joined is edited, closed, deleted, or completed, or your order on it is adjusted or removed.",
    },
    {
      id: 'order-status',
      label: 'Order status',
      description: 'Your payment is confirmed, or the items you ordered have arrived.',
    },
    {
      id: 'social',
      label: 'Social',
      description: 'Someone follows your profile.',
    },
  ];

  notificationSettings = signal<NotificationSetting[]>([]);
  selectedLanguage = signal('english');
  darkMode = signal(false);

  languages = [
    { value: 'english', label: 'English' },
    { value: 'indonesian', label: 'Indonesian' },
  ];

  loadSettings() {
    this.http.get<SettingsResponse>(`${environment.api}/settings`, { withCredentials: true }).subscribe({
      next: (res) => {
        // Map backend data to frontend structure
        const settings = this.notificationMetadata.map(meta => ({
          id: meta.id,
          label: meta.label,
          description: meta.description,
          push: res.data.notifications[meta.id]?.push ?? false,
          email: res.data.notifications[meta.id]?.email ?? false,
        }));
        
        this.notificationSettings.set(settings);
        this.selectedLanguage.set(res.data.language);
        this.darkMode.set(res.data.dark_mode);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  saveSettings() {
    // Convert frontend structure to backend format
    const notifications: Record<string, { push: boolean; email: boolean }> = {};
    this.notificationSettings().forEach(setting => {
      notifications[setting.id] = {
        push: setting.push,
        email: setting.email,
      };
    });

    const data = {
      notifications,
      language: this.selectedLanguage(),
      dark_mode: this.darkMode(),
    };

    this.http.put<SettingsResponse>(`${environment.api}/settings`, data, { withCredentials: true }).subscribe();
  }

  togglePush(settingId: string) {
    this.notificationSettings.update(settings =>
      settings.map(s =>
        s.id === settingId ? { ...s, push: !s.push } : s
      )
    );
    this.saveSettings();
  }

  toggleEmail(settingId: string) {
    this.notificationSettings.update(settings =>
      settings.map(s =>
        s.id === settingId ? { ...s, email: !s.email } : s
      )
    );
    this.saveSettings();
  }

  toggleDarkMode() {
    this.darkMode.update(mode => !mode);
    this.saveSettings();
  }

  changeLanguage(language: string) {
    this.selectedLanguage.set(language);
    this.saveSettings();
  }
}
