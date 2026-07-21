import { Routes } from '@angular/router';
import { ProfilePage } from './profile-page';
import { PAYMENT_METHOD_ROUTES } from '../payment-method/payment-method.routes';
import { authGuard } from '../../core/auth.guard';

export const PROFILE_ROUTES: Routes = [
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [authGuard],
    title: $localize`Profile`,
    data: { hideDesktopHeader: true },
    children: [
      {
        path: '',
        loadComponent: () => import('./account/account-page').then(m => m.AccountPage),
        title: $localize`Account`,
        data: { forceTopBarSolid: true },
      },
      {
        path: 'account',
        loadComponent: () => import('./account/account-page').then(m => m.AccountPage),
        title: $localize`Account`,
        data: { forceTopBarSolid: true },
      },
      {
        path: 'followers',
        loadComponent: () => import('./followers/followers-page').then(m => m.FollowersPage),
        title: $localize`Followers`,
        data: { forceTopBarSolid: true },
      },
      {
        path: 'following',
        loadComponent: () => import('./following/following-page').then(m => m.FollowingPage),
        title: $localize`Following`,
        data: { forceTopBarSolid: true },
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings-page').then(m => m.SettingsPage),
        title: $localize`Settings`,
        data: { forceTopBarSolid: true },
      },
      ...PAYMENT_METHOD_ROUTES,
    ],
  },
];
