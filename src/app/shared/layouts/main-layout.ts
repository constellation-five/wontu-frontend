import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { PageHeaderComponent } from '../components/page-header/page-header';
import { TopBarComponent } from '../components/top-bar/top-bar';
import { PageHeaderService } from '../../core/page-header.service';

@Component({
  selector: 'main-layout',
  template: `
    <navbar />

    @if (pageHeaderService.showHeader()) {
      <app-top-bar />
    }

    <main class="layout-body">
      @if (pageHeaderService.showHeader()) {
        <app-page-header />
      }
      <router-outlet />
    </main>
  `,
  styleUrl: './main-layout.scss',
  imports: [RouterOutlet, Navbar, PageHeaderComponent, TopBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  pageHeaderService = inject(PageHeaderService);
}
