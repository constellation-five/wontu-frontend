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
  // Set once the seller actually closes the offer / marks items arrived —
  // distinct from closing_time/arrival_time, which are just the plan.
  closed_at: string | null;
  arrived_at: string | null;
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

export interface MyOrder {
  status: 'pending' | 'confirmed' | 'completed';
  is_verified: boolean;
  payment_proof_url: string | null;
  joined_at: string;
  payment_submitted_at: string | null;
  verified_at: string | null;
  items: CheckoutItem[];
}

export interface MyOrderSummary extends MyOrder {
  offer_id: number;
  merchant_name: string;
  created_at: string;
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

  placeOrder(offerId: number, items: { item_id: number; quantity: number; notes?: string }[]) {
    return this.http.post(`${environment.api}/offers/${offerId}/place-order`, {
      items: items,
    });
  }

  replaceOrder(offerId: number, items: { item_id: number; quantity: number; notes?: string }[]) {
    return this.http.post(`${environment.api}/offers/${offerId}/replace-order`, {
      items: items,
    });
  }

  cancelOrder(offerId: number) {
    return this.http.post(`${environment.api}/offers/${offerId}/cancel-order`, {});
  }

  // The buyer's order for a single offer, if any — the backend is the only
  // source of truth for this (no client-side caching), since an order is a
  // real, persisted record there.
  getMyOrder(offerId: number) {
    return this.http.get<{ status: string; data: MyOrder | null }>(
      `${environment.api}/offers/${offerId}/my-order`,
    );
  }

  // All of the buyer's orders, across every offer — backs the order history page.
  getMyOrders() {
    return this.http.get<{ status: string; data: MyOrderSummary[] }>(
      `${environment.api}/my-orders`,
    );
  }
}
