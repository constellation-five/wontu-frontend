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
    // Karena rute di web.php kamu tadi /offers/{offer}
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
        })
      );
  }
}