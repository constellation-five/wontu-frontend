import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'signin', loadComponent: () => import('./sign-in-page') },
  { path: 'complete-signup', loadComponent: () => import('./complete-sign-up-page') },
];
