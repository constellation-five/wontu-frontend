import { Routes } from '@angular/router';
import { HistoryPage } from './features/history/history-page';
import { OfferPage } from './features/offer/offer-page';
import { ProfilePage } from './features/profile/profile-page';
import { RequestPage } from './features/request/request-page';
import { NavbarLayout } from './shared/layouts/navbar-layout';
import { MainLayout } from './shared/layouts/main-layout';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'offer' },
  { path: 'signin', loadComponent: () => import('./features/auth/sign-in-page') },
  { path: 'complete-signup', loadComponent: () => import('./features/auth/complete-sign-up-page') },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        component: NavbarLayout,
        children: [
          { path: 'offer', component: OfferPage },
          { path: 'request', component: RequestPage },
          { path: 'history', component: HistoryPage, canActivate: [authGuard] },
          { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'offer' },
];
