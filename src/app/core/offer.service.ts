import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment'; 
import { Offer } from './offer'; 
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OfferService {
  private readonly http = inject(HttpClient);

  private readonly state = signal<{
    offers: Offer[];
    isLoading: boolean;
  }>({
    offers: [],
    isLoading: false,
  });

  readonly allOffers = computed(() => this.state().offers);
  readonly isLoading = computed(() => this.state().isLoading);

  getOfferById(id: string) {
    return this.http.get<Offer>(`${environment.api}/offers/${id}`);
  }

  loadOffers() {
    this.state.update((s) => ({ ...s, isLoading: true }));
    return this.http.get<Offer[]>(`${environment.api}/offers`).pipe(
      tap((data) => {
        this.state.update((s) => ({
          ...s,
          offers: data,
          isLoading: false,
        }));
      })
    );
  }

  placeOrder(offerId: number, items: { item_id: number; quantity: number }[]) {
    return this.http.post(`${environment.api}/offers/${offerId}/place-order`, {
      items: items
    });
  }

  updateOrder(offerId: number, items: { item_id: number; quantity_diff: number }[]) {
    return this.http.post(`${environment.api}/offers/${offerId}/update-order`, {
      items: items
    });
  }

  replaceOrder(offerId: number, oldItems: { item_id: number; quantity: number }[], newItems: { item_id: number; quantity: number }[]) {
    return this.http.post(`${environment.api}/offers/${offerId}/replace-order`, {
      old_items: oldItems,
      new_items: newItems
    });
  }

  cancelOrder(offerId: number, items: { item_id: number; quantity: number }[]) {
    return this.http.post(`${environment.api}/offers/${offerId}/cancel-order`, {
      items: items
    });
  }
}