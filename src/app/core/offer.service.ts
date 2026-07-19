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
  location_label?: string | null;
  latitude?: number;
  longitude?: number;
  closing_time: string;
  arrival_time: string;
  // Set once the seller actually closes the offer / marks items arrived —
  // distinct from closing_time/arrival_time, which are just the plan.
  closed_at: string | null;
  arrived_at: string | null;
  // Set once every buyer's payment on this (closed) offer has been confirmed.
  payments_confirmed_at: string | null;
  has_cod_payment: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  items: OfferItem[];
  seller: {
    user_id?: string;
    name: string;
    avatar: string;
    received_ratings_avg_rating?: number;
    received_ratings_count?: number;
  };
}

export interface CheckoutItem {
  item: OfferItem;
  quantity: number;
  notes?: string;
}

export interface MyOrder {
  is_confirmed: boolean;
  payment_proof_url: string | null;
  joined_at: string;
  payment_submitted_at: string | null;
  confirmed_at: string | null;
  items: CheckoutItem[];
}

export interface MyOrderSummary extends MyOrder {
  offer_id: number;
  merchant_name: string;
  created_at: string;
}

/** A single buyer's order, as seen by the seller on the Manage Offer page. */
export interface OfferOrder {
  offer_buyer_id: number;
  buyer: {
    user_id: string;
    name: string;
    avatar: string;
  };
  is_confirmed: boolean;
  payment_proof_url: string | null;
  joined_at: string;
  payment_submitted_at: string | null;
  confirmed_at: string | null;
  items: CheckoutItem[];
}

export interface OfferItemInput {
  item_id?: number;
  item_name: string;
  item_price: number;
  item_url?: string | null;
  slot: number;
  image_url?: string | null;
}

export interface OfferInput {
  category: string;
  merchant_name: string;
  location_label?: string | null;
  location_lat: number;
  location_lng: number;
  closing_time: string;
  arrival_time: string;
  has_cod_payment?: boolean;
  payment_method_ids: number[];
  items: OfferItemInput[];
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

  loadOffers(search?: string, coords?: { lat: number; lng: number }) {
    this.state.update((s) => ({ ...s, isLoading: true }));

    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (coords) {
      params = params.set('lat', coords.lat).set('lng', coords.lng);
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

  getOfferPaymentMethods(offerId: number) {
    return this.http.get<{ status: string; data: { payment_method_id: number; bank_name: string; account_name: string; account_number: string }[] }>(
      `${environment.api}/offers/${offerId}/payment-methods`,
    );
  }

  // --- Seller flow ---

  createOffer(payload: OfferInput) {
    return this.http.post<{ message: string; offer: Offer }>(`${environment.api}/offers`, payload);
  }

  updateOffer(offerId: number, payload: OfferInput) {
    return this.http.put<{ message: string; offer: Offer }>(
      `${environment.api}/offers/${offerId}`,
      payload,
    );
  }

  deleteOffer(offerId: number) {
    return this.http.delete<{ message: string }>(`${environment.api}/offers/${offerId}`);
  }

  getMyOffers() {
    return this.http.get<{ status: string; data: Offer[] }>(`${environment.api}/offers/mine`);
  }

  getOfferOrders(offerId: number) {
    return this.http.get<{ status: string; data: OfferOrder[] }>(
      `${environment.api}/offers/${offerId}/orders`,
    );
  }

  confirmPayment(offerId: number, offerBuyerId: number) {
    return this.http.post<{ message: string; offer: Offer }>(
      `${environment.api}/offers/${offerId}/orders/${offerBuyerId}/confirm-payment`,
      {},
    );
  }

  closeOfferNow(offerId: number) {
    return this.http.post<{ message: string; offer: Offer }>(
      `${environment.api}/offers/${offerId}/close`,
      {},
    );
  }

  markItemsArrived(offerId: number) {
    return this.http.post<{ message: string; offer: Offer }>(
      `${environment.api}/offers/${offerId}/mark-arrived`,
      {},
    );
  }

  respondToOfferChanges(offerId: number, action: 'keep' | 'leave') {
    return this.http.post<{ message: string }>(
      `${environment.api}/offers/${offerId}/orders/respond-to-changes`,
      { action },
    );
  }

  submitPayment(offerId: number, paymentProofUrl: string) {
    return this.http.post<{ message: string }>(
      `${environment.api}/offers/${offerId}/submit-payment`,
      { payment_proof_url: paymentProofUrl },
    );
  }

  /** The logged-in user's full list of saved payment methods (seller-side selection on the Create Offer form). */
  listMyPaymentMethods() {
    return this.http.get<{
      success: boolean;
      message: string;
      data: { payment_method_id: number; bank_name: string; account_name: string; account_number: string }[];
    }>(`${environment.api}/payment-methods`);
  }

  /** Generic image upload (item images, payment proof); returns a URL usable directly as image_url/payment_proof_url. */
  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${environment.api}/uploads/image`, formData);
  }

  /** Same as uploadImage(), but emits HttpEvents (including UploadProgress) so callers can show a progress indicator. */
  uploadImageWithProgress(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${environment.api}/uploads/image`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }

  /**
   * Deletes an uploaded-but-never-attached file (e.g. a payment proof the
   * user picked but never submitted before reloading/navigating away). Uses
   * `fetch(..., { keepalive: true })` instead of HttpClient so the request
   * survives a page unload — a `beforeunload` handler is the main caller.
   */
  deleteUpload(url: string) {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    const xsrfToken = match ? decodeURIComponent(match[1]) : '';

    fetch(`${environment.api}/uploads/delete`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({ url }),
    }).catch(() => {});
  }
}
