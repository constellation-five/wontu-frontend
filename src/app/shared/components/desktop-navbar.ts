import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NAV_LINKS } from './nav-links';
import { Auth } from '../../core/auth';
import { isProtectedRoute } from '../../core/routes.config';

@Component({
  selector: 'desktop-navbar',
  templateUrl: './desktop-navbar.html',
  styleUrl: './desktop-navbar.scss',
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
export class DesktopNavbar {
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
}
