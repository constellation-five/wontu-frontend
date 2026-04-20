import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { NAV_LINKS } from './nav-links';

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
}
