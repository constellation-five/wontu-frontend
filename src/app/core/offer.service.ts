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

  // Checkout state management
  private readonly checkoutState = signal<CheckoutState | null>(null);
  readonly currentCheckout = computed(() => this.checkoutState());

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
  setCheckoutState(offerId: number, items: CheckoutItem[]) {
    this.checkoutState.set({
      offerId,
      items,
      timestamp: Date.now(),
    });
  }

  getCheckoutState(offerId: number): CheckoutItem[] | null {
    const state = this.checkoutState();
    if (!state || state.offerId !== offerId) {
      return null;
    }
    
    // Check if state is not too old (e.g., 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - state.timestamp > oneHour) {
      this.clearCheckoutState();
      return null;
    }
    
    return state.items;
  }

  clearCheckoutState() {
    this.checkoutState.set(null);
  }
}
