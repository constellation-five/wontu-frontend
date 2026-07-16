import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { OfferService } from './offer.service';

/**
 * Requires the offer named by the `:id` route param to belong to the logged-in
 * user. Runs before `offerResolver` (guards run before resolvers), so it does
 * its own lightweight fetch rather than relying on resolved route data.
 */
export const sellerGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const offerService = inject(OfferService);
  const router = inject(Router);

  const id = route.paramMap.get('id');
  if (!id) return router.createUrlTree(['/offers']);

  return offerService.getOfferById(id).pipe(
    map((offer) =>
      offer.seller_id === auth.user()?.user_id ? true : router.createUrlTree(['/offers', id]),
    ),
    catchError(() => of(router.createUrlTree(['/offers']))),
  );
};
