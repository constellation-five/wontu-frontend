import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { PageHeaderComponent } from '../components/page-header/page-header';
import { PageHeaderService } from '../../core/page-header.service';

@Component({
  selector: 'main-layout',
  template: `
    <navbar />

    <main class="layout-body">
      @if (pageHeaderService.showHeader()) {
        <app-page-header />
      }
      <router-outlet />
    </main>
  `,
  styleUrl: './main-layout.scss',
  imports: [RouterOutlet, Navbar, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  pageHeaderService = inject(PageHeaderService);
}
