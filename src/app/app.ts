import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly title = signal('wontu-frontend');
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  ngOnInit() {
    this.cleanupOtherServiceWorkers();

    const returnUrl = sessionStorage.getItem('authReturnUrl');
    if (returnUrl && this.auth.user()) {
      sessionStorage.removeItem('authReturnUrl');
      // Use navigateByUrl in next tick to avoid racing initial navigation
      setTimeout(() => {
        this.router.navigateByUrl(returnUrl);
      });
    }
  }

  private cleanupOtherServiceWorkers() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        const currentBaseHref = document.querySelector('base')?.getAttribute('href') || '/';
        const expectedScope = new URL(currentBaseHref, window.location.origin).href;

        for (const registration of registrations) {
          if (registration.scope !== expectedScope) {
            // Unsubscribe from push notifications before unregistering
            registration.pushManager.getSubscription().then((sub) => {
              if (sub) sub.unsubscribe();
            });
            registration.unregister();
          }
        }
      });
    }
  }
}
