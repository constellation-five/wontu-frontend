import { Routes } from '@angular/router';
import { MainLayout } from './shared/layouts/main-layout';
import { OFFER_ROUTES } from './features/offer/offer.routes';
import { CHAT_ROUTES } from './features/chat/chat.routes';
import { REQUEST_ROUTES } from './features/request/request.routes';
import { HISTORY_ROUTES } from './features/history/history.routes';
import { PROFILE_ROUTES } from './features/profile/profile.routes';
import { AUTH_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'offers' },
  ...AUTH_ROUTES,
  {
    path: '',
    component: MainLayout,
    children: [
      ...OFFER_ROUTES,
      ...CHAT_ROUTES,
      ...REQUEST_ROUTES,
      ...HISTORY_ROUTES,
      ...PROFILE_ROUTES,
    ],
  },
  { path: '**', redirectTo: 'offers' },
];
