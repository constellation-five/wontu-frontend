import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

export interface OfferItem {
  item_id: number;
  offer_id: number;
  item_name: string;
  item_price: string;
  image_url: string;
  current_slot: number;
  slot: number;
  item_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  offer_id: number;
  seller_id: string;
  category: string;
  merchant_name: string;
  closing_time: string;
  arrival_time: string;
  has_cod_payment: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  items: OfferItem[];
  seller: {
    name: string;
    avatar: string;
  };
}

export interface CheckoutItem {
  item: OfferItem;
  quantity: number;
  notes?: string;
}

export interface CheckoutState {
  offerId: number;
  items: CheckoutItem[];
  timestamp: number;
}

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

  loadOffers(search?: string) {
    this.state.update((s) => ({ ...s, isLoading: true }));

    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<{ status: string; data: Offer[] }>(`${environment.api}/offers`, { params })
      .pipe(
        tap((response) => {
          this.state.update((s) => ({
            ...s,
            offers: response.data,
            isLoading: false,
          }));
        }),
      );
  }

  placeOrder(offerId: number, items: { item_id: number; quantity: number }[]) {
    return this.http.post(`${environment.api}/offers/${offerId}/place-order`, {
      items: items,
    });
  }

  replaceOrder(
    offerId: number,
    oldItems: { item_id: number; quantity: number }[],
    newItems: { item_id: number; quantity: number }[],
  ) {
    return this.http.post(`${environment.api}/offers/${offerId}/replace-order`, {
      old_items: oldItems,
      new_items: newItems,
    });
  }

  cancelOrder(offerId: number, items: { item_id: number; quantity: number }[]) {
    return this.http.post(`${environment.api}/offers/${offerId}/cancel-order`, {
      items: items,
    });
  }

  // Checkout state methods
  // Persisted per-offer in localStorage (not just in-memory) so that a placed
  // order for an offer survives a page refresh, and so that placed orders on
  // different offers don't clobber each other's state (a person may have at
  // most one active order per offer, but can have orders on several offers).
  setCheckoutState(offerId: number, items: CheckoutItem[]) {
    const state: CheckoutState = { offerId, items, timestamp: Date.now() };
    localStorage.setItem(`checkout_${offerId}`, JSON.stringify(state));
  }

  getCheckoutState(offerId: number): CheckoutItem[] | null {
    const raw = localStorage.getItem(`checkout_${offerId}`);
    if (!raw) return null;

    try {
      const state: CheckoutState = JSON.parse(raw);
      return state.items;
    } catch (e) {
      console.error('Error parsing checkout state:', e);
      return null;
    }
  }

  clearCheckoutState(offerId: number) {
    localStorage.removeItem(`checkout_${offerId}`);
  }
}
