import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_LINKS } from './nav-links';
import { Auth } from '../../core/auth';

@Component({
  selector: 'desktop-navbar',
  templateUrl: './desktop-navbar.html',
  styleUrl: './desktop-navbar.scss',
  imports: [MatListModule, MatIconModule, MatButtonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopNavbar {
  readonly links = NAV_LINKS;
  private readonly auth = inject(Auth);
  readonly user = this.auth.user;

  logout() {
    this.auth.logout().subscribe();
  }
}
