import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.api;

  rateSeller(userId: string, rating: number, offerId: number) {
    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.baseUrl}/profile/${userId}/rating`,
      { rating, offer_id: offerId }
    );
  }
}
