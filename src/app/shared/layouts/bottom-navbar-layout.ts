import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { BottomNavbar } from '../components/bottom-navbar';

@Component({
  selector: 'bottom-navbar-layout',
  template: `
    <router-outlet />
    <bottom-navbar />
  `,
  imports: [RouterOutlet, BottomNavbar, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavbarLayout {}
