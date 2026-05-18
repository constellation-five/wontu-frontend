import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth } from '../../../core/auth';
import { isProtectedRoute } from '../../../core/routes.config';

export type NavLink = {
  label: string;
  path: string;
  icon: string;
};

export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Offers', path: '/offer', icon: 'shopping_bag' },
  { label: 'Requests', path: '/request', icon: 'concierge' },
  { label: 'History', path: '/history', icon: 'receipt_long' },
  { label: 'Profile', path: '/profile', icon: 'account_circle' },
];

@Component({
  selector: 'navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly links = NAV_LINKS;
  private readonly auth = inject(Auth);
  protected readonly router = inject(Router);
  readonly user = this.auth.user;
  readonly avatarError = signal(false);
  readonly isProtectedRoute = isProtectedRoute;

  logout() {
    this.auth.logout().subscribe();
  }

  goToSignIn() {
    this.router.navigate(['/signin'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  onAvatarError() {
    this.avatarError.set(true);
  }

  blurItem(event: Event) {
    (event.currentTarget as HTMLElement)?.blur();
  }
}
