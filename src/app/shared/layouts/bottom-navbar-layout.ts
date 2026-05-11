import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { BottomNavbar } from '../components/bottom-navbar';

@Component({
  selector: 'bottom-navbar-layout',
  template: `
    <mat-tab-nav-panel #tabPanel class="flex-1">
      <router-outlet />
    </mat-tab-nav-panel>
    <bottom-navbar class="md:hidden" [tabPanel]="tabPanel"></bottom-navbar>
  `,
  imports: [RouterOutlet, BottomNavbar, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavbarLayout {}
