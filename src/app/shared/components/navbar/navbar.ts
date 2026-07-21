import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth.service';
import { isProtectedRoute } from '../../../core/routes.config';
import { ButtonColorDirective } from '../../directives/button';

export type NavLink = {
  label: string;
  path: string;
  icon: string;
};

export const NAV_LINKS: readonly NavLink[] = [
  { label: $localize`Offers`, path: '/offers', icon: 'shopping_bag' },
  { label: $localize`Requests`, path: '/requests', icon: 'concierge' },
  { label: $localize`Activity`, path: '/activity', icon: 'receipt_long' },
  { label: $localize`Profile`, path: '/profile', icon: 'account_circle' },
];

@Component({
  selector: 'navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  host: {
    '[class.mobile-top-level-page]': 'isTopLevelPage() && !shouldHideBottomBar()',
    '[class.hidden]': 'shouldHideBottomBar()',
  },
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
    ButtonColorDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly links = NAV_LINKS;
  private readonly auth = inject(AuthService);
  protected readonly router = inject(Router);
  readonly user = this.auth.user;
  readonly avatarError = signal(false);
  readonly isProtectedRoute = isProtectedRoute;
  readonly hideBottomBar = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
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

  logout() {
    this.auth.logout().subscribe();
  }

  goToSignIn() {
    this.router.navigate(['/signin'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  onAvatarError() {
    this.avatarError.set(true);
  }

  blurItem(event: Event) {
    (event.currentTarget as HTMLElement)?.blur();
  }

  isTopLevelPage(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    // Check if exact match with nav links
    const isExactMatch = this.links.some((link) => link.path === path);
    // Or check if it's a profile subpage
    const isProfileSubpage = path.startsWith('/profile/');
    return isExactMatch || isProfileSubpage;
  }

  shouldHideBottomBar(): boolean {
    return this.hideBottomBar();
  }
}
