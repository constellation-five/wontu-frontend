import { Routes } from '@angular/router';
import { HistoryPage } from './features/history/history-page';
import { OfferPage } from './features/offer/offer-page';
import { ProfilePage } from './features/profile/profile-page';
import { RequestPage } from './features/request/request-page';
import { NavbarLayout } from './shared/layouts/navbar-layout';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'offer' },
  { path: 'sign-in', loadComponent: () => import('./features/auth/sign-in-page') },
  { path: 'auth/callback', loadComponent: () => import('./features/auth/callback-page') },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register-page') },
  {
    path: '',
    component: NavbarLayout,
    children: [
      { path: 'offer', component: OfferPage },
      { path: 'request', component: RequestPage },
      { path: 'history', component: HistoryPage },
      { path: 'profile', component: ProfilePage },
    ],
  },
  { path: '**', redirectTo: 'offer' },
];
