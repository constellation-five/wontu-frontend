import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NAV_LINKS } from './nav-links';
import { Auth } from '../../core/auth';
import { isProtectedRoute } from '../../core/routes.config';

@Component({
  selector: 'bottom-navbar',
  templateUrl: './bottom-navbar.html',
  styleUrl: './bottom-navbar.scss',
  imports: [MatListModule, MatIconModule, MatButtonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavbar {
  readonly links = NAV_LINKS;
  private readonly auth = inject(Auth);
  protected readonly router = inject(Router);
  readonly user = this.auth.user;
  readonly avatarError = signal(false);
  readonly isProtectedRoute = isProtectedRoute;

  onAvatarError() {
    this.avatarError.set(true);
  }

  blurItem(event: Event) {
    (event.currentTarget as HTMLElement)?.blur();
  }
}
