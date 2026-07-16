import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Offer, OfferService } from './offer.service';

/** Fetches the offer named by the `:id` route param once, shared by sellerGuard and the page component via route data. */
export const offerResolver: ResolveFn<Offer | null> = (route) => {
  const offerService = inject(OfferService);
  const id = route.paramMap.get('id');
  if (!id) return of(null);

  return offerService.getOfferById(id).pipe(catchError(() => of(null)));
};
