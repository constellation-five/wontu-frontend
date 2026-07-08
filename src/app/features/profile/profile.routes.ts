import { Routes } from '@angular/router';
import { ProfilePage } from './profile-page';
import { PAYMENT_METHOD_ROUTES } from '../payment-method/payment-method.routes';
import { authGuard } from '../../core/auth.guard';

export const PROFILE_ROUTES: Routes = [
  {
    path: 'profile',
    canActivate: [authGuard],
    title: 'Profile',
    data: { hideHeader: true },
    children: [{ path: '', component: ProfilePage }, ...PAYMENT_METHOD_ROUTES],
  },
];
