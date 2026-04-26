import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { Navbar } from '../components/navbar';

@Component({
  selector: 'navbar-layout',
  template: `
    <mat-tab-nav-panel #tabPanel class="flex-1">
      <router-outlet />
    </mat-tab-nav-panel>
    <navbar class="md:hidden" [tabPanel]="tabPanel"></navbar>
  `,
  imports: [RouterOutlet, Navbar, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarLayout {}
