import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNavbar } from '../components/side-navbar';

@Component({
  selector: 'main-layout',
  template: `
    <div class="layout-page">
      <side-navbar />

      <main class="layout-body">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './main-layout.scss',
  imports: [RouterOutlet, SideNavbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {}
