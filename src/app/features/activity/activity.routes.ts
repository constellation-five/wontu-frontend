import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth.guard';

export const ACTIVITY_ROUTES: Routes = [
  {
    path: 'activity',
    loadComponent: () => import('./activity-page').then((m) => m.ActivityPage),
    canActivate: [authGuard],
    title: 'Order Activity',
    data: { hideHeader: true },
  },
];
