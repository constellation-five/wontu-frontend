import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { NAV_LINKS } from './nav-links';
import { Auth } from '../../core/auth';
import { isProtectedRoute } from '../../core/routes.config';

@Component({
  selector: 'navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  imports: [MatTabsModule, MatIconModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly tabPanel = input.required<MatTabNavPanel>();

  readonly links = NAV_LINKS;
  private readonly auth = inject(Auth);
  readonly user = this.auth.user;
  readonly avatarError = signal(false);
  readonly isProtectedRoute = isProtectedRoute;

  onAvatarError() {
    this.avatarError.set(true);
  }
}
