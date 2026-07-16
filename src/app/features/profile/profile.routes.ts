import { Routes } from '@angular/router';
import { ProfilePage } from './profile-page';
import { PAYMENT_METHOD_ROUTES } from '../payment-method/payment-method.routes';
import { authGuard } from '../../core/auth.guard';

export const PROFILE_ROUTES: Routes = [
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [authGuard],
    title: 'Profile',
    data: { hideDesktopHeader: true },
    children: [
      {
        path: '',
        loadComponent: () => import('./account/account-page').then(m => m.AccountPage),
        title: 'Account',
        data: { forceTopBarSolid: true },
      },
      {
        path: 'account',
        loadComponent: () => import('./account/account-page').then(m => m.AccountPage),
        title: 'Account',
        data: { forceTopBarSolid: true },
      },
      {
        path: 'followers',
        loadComponent: () => import('./followers/followers-page').then(m => m.FollowersPage),
        title: 'Followers',
        data: { forceTopBarSolid: true },
      },
      {
        path: 'following',
        loadComponent: () => import('./following/following-page').then(m => m.FollowingPage),
        title: 'Following',
        data: { forceTopBarSolid: true },
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings-page').then(m => m.SettingsPage),
        title: 'Settings',
        data: { forceTopBarSolid: true },
      },
      ...PAYMENT_METHOD_ROUTES,
    ],
  },
];
