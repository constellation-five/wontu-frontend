import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from './auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.user()) {
    return true;
  }

  // Not logged in. Store the returnUrl in query params
  return router.createUrlTree(['/signin'], {
    queryParams: { returnUrl: state.url },
  });
};
