import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth.guard';

export const HISTORY_ROUTES: Routes = [
  {
    path: 'history',
    loadComponent: () => import('./history-page').then((m) => m.HistoryPage),
    canActivate: [authGuard],
    title: 'Order History',
    data: { hideHeader: true },
  },
];
