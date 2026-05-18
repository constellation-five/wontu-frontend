import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';

@Component({
  selector: 'main-layout',
  template: `
    <div class="layout-page">
      <navbar />

      <main class="layout-body">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './main-layout.scss',
  imports: [RouterOutlet, Navbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {}
