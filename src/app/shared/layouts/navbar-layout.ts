import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { Navbar } from '../components/navbar';

@Component({
  selector: 'navbar-layout',
  template: `
    <navbar class="md:hidden" [tabPanel]="tabPanel"></navbar>
    <mat-tab-nav-panel #tabPanel>
      <router-outlet />
    </mat-tab-nav-panel>
  `,
  imports: [RouterOutlet, Navbar, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarLayout {}
