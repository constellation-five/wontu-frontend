import { Injectable, signal, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

export interface MenuItem {
  label: string;
  action: () => void;
}

export interface InfoAction {
  icon?: string;
  action: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class PageHeaderService {
  title = signal<string>('');
  breadcrumbs = signal<BreadcrumbItem[]>([]);
  showHeader = signal<boolean>(true);
  menuItems = signal<MenuItem[]>([]);
  infoAction = signal<InfoAction | null>(null);
  hideDesktopHeader = signal<boolean>(false);
  forceTopBarSolid = signal<boolean>(false);
  customBackAction = signal<(() => void) | null>(null);

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private titleService = inject(Title);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const routeData = this.buildRouteData(this.activatedRoute.root);

      if (routeData.hideHeader) {
        this.showHeader.set(false);
      } else {
        this.showHeader.set(true);
        this.title.set(routeData.title);
        this.breadcrumbs.set(routeData.breadcrumbs);
        this.updateDocumentTitle(routeData.title);
      }
      this.hideDesktopHeader.set(routeData.hideDesktopHeader);
      this.forceTopBarSolid.set(routeData.forceTopBarSolid);
    });
  }

  setTitle(title: string) {
    this.title.set(title);
    this.updateDocumentTitle(title);
  }

  private updateDocumentTitle(title: string) {
    if (title) {
      this.titleService.setTitle(`${title} - Wontu`);
    } else {
      this.titleService.setTitle('Wontu');
    }
  }

  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
    this.breadcrumbs.set(breadcrumbs);
  }

  setInfoAction(action: InfoAction | null) {
    this.infoAction.set(action);
  }

  private buildRouteData(route: ActivatedRoute): {
    title: string;
    breadcrumbs: BreadcrumbItem[];
    hideHeader: boolean;
    hideDesktopHeader: boolean;
    forceTopBarSolid: boolean;
  } {
    let currentRoute: ActivatedRoute | null = route;
    let title = '';
    let hideHeader = false;
    let hideDesktopHeader = false;
    let forceTopBarSolid = false;
    let url = '';
    const breadcrumbs: BreadcrumbItem[] = [];

    while (currentRoute) {
      if (currentRoute.routeConfig && currentRoute.routeConfig.path !== undefined) {
        const path = currentRoute.routeConfig.path;

        // Append URL segment
        currentRoute.snapshot.url.forEach((segment) => {
          url += `/${segment.path}`;
        });

        const data = currentRoute.routeConfig.data;
        const routeTitle = currentRoute.routeConfig.title as string;

        if (data?.['breadcrumb'] || routeTitle) {
          const label = data?.['breadcrumb'] || routeTitle;

          if (breadcrumbs.length === 0 || breadcrumbs[breadcrumbs.length - 1].label !== label) {
            breadcrumbs.push({
              label: label,
              route: url,
            });
          }
        }

        if (routeTitle) {
          title = routeTitle;
        }

        if (data?.['hideHeader']) {
          hideHeader = true;
        }

        if (data?.['hideDesktopHeader']) {
          hideDesktopHeader = true;
        }

        if (data?.['forceTopBarSolid']) {
          forceTopBarSolid = true;
        }
      }

      currentRoute = currentRoute.firstChild;
    }

    return { title, breadcrumbs, hideHeader, hideDesktopHeader, forceTopBarSolid };
  }
}
