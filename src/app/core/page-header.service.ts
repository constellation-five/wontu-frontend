import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PageHeaderService {
  title = signal<string>('');
  breadcrumbs = signal<BreadcrumbItem[]>([]);
  showHeader = signal<boolean>(true);

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      console.log(this.activatedRoute);
      const routeData = this.buildRouteData(this.activatedRoute.root);

      if (routeData.hideHeader) {
        this.showHeader.set(false);
      } else {
        this.showHeader.set(true);
        this.title.set(routeData.title);
        this.breadcrumbs.set(routeData.breadcrumbs);
      }
    });
  }

  setTitle(title: string) {
    this.title.set(title);
  }

  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
    this.breadcrumbs.set(breadcrumbs);
  }

  private buildRouteData(route: ActivatedRoute): {
    title: string;
    breadcrumbs: BreadcrumbItem[];
    hideHeader: boolean;
  } {
    let currentRoute: ActivatedRoute | null = route;
    let title = '';
    let hideHeader = false;
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
      }

      currentRoute = currentRoute.firstChild;
    }

    console.log('Route data extracted:', { title, breadcrumbs, hideHeader });
    return { title, breadcrumbs, hideHeader };
  }
}
