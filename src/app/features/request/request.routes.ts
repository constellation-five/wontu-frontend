import { Routes } from '@angular/router';
import { RequestPage } from './request-page';

export const REQUEST_ROUTES: Routes = [
  {
    path: 'requests',
    component: RequestPage,
    title: $localize`Requests`,
    data: { hideHeader: true },
  },
];
