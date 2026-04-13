import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_LINKS } from './nav-links';

@Component({
  selector: 'desktop-navbar',
  templateUrl: './desktop-navbar.html',
  styleUrl: './desktop-navbar.scss',
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopNavbar {
  readonly links = NAV_LINKS;
}
