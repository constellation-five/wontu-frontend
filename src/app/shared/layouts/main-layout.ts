import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Navbar } from '../components/navbar/navbar';
import { PageHeaderComponent } from '../components/page-header/page-header';
import { TopBarComponent } from '../components/top-bar/top-bar';
import { PageHeaderService } from '../../core/page-header.service';
import { NotificationToast } from '../components/notification-toast/notification-toast';
import { BottomBarService } from '../../core/bottom-bar.service';

@Component({
  selector: 'main-layout',
  template: `
    <navbar />

    @if (pageHeaderService.showHeader()) {
      <app-top-bar />
    }

    <main
      class="layout-body"
      [class.no-bottom-margin]="shouldHideBottomBar() && !hasBottomActionBar()"
      [class.action-bar-margin]="hasBottomActionBar()"
    >
      @if (pageHeaderService.showHeader()) {
        <app-page-header />
      }
      <router-outlet />
    </main>

    <app-notification-toast />
  `,
  styleUrl: './main-layout.scss',
  imports: [RouterOutlet, Navbar, PageHeaderComponent, TopBarComponent, NotificationToast],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  pageHeaderService = inject(PageHeaderService);
  private readonly router = inject(Router);
  private readonly bottomBarService = inject(BottomBarService);
  private hideBottomBar = signal(false);

  // Whether a page has set contextual bottom-bar actions (via
  // BottomBarService) — distinct from the persistent nav Navbar hides via
  // the `hideBottomBar` route data flag. Pages using one generally hide the
  // other, but the body still needs room reserved for whichever is showing.
  readonly hasBottomActionBar = computed(() => this.bottomBarService.portal() !== null);

  constructor() {
    this.router.events
      .pipe(filter((event: any) => event instanceof NavigationEnd))
      .subscribe(() => {
        const route = this.router.routerState.root;
        let child = route;
        while (child.firstChild) {
          child = child.firstChild;
        }
        const hideBottomBar = child.snapshot.data['hideBottomBar'] === true;
        this.hideBottomBar.set(hideBottomBar);
      });
  }

  shouldHideBottomBar(): boolean {
    return this.hideBottomBar();
  }
}
