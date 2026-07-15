import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { tap, finalize } from 'rxjs';

export interface RequestItem {
  request_id: number;
  requester_id: string;
  item_name: string;
  category: 'food' | 'other';
  arrival_time: string;
  location_label: string | null;
  total_votes: number;
  created_at: string;
  updated_at: string;
  
  has_voted?: boolean; 
  requester?: {
    name: string;
    avatar: string;
  };
}

export interface CreateRequestPayload {
  item_name: string;
  category: 'food' | 'other';
  arrival_time: string;
  location_label?: string;
  location?: { lat: number; lng: number }; 
}

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private readonly http = inject(HttpClient);

  private readonly state = signal<{
    requests: RequestItem[];
    isLoading: boolean;
  }>({
    requests: [],
    isLoading: false,
  });

  readonly allRequests = computed(() => this.state().requests);
  readonly isLoading = computed(() => this.state().isLoading);

  // FETCH ALL REQUESTS
  loadRequests(search?: string, coords?: { lat: number; lng: number }, silent = false) {
    
    if (!silent) {
      this.state.update((s) => ({ ...s, isLoading: true }));
    }

    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (coords) params = params.set('lat', coords.lat).set('lng', coords.lng);

    return this.http
      .get<{ status: string; data: RequestItem[] }>(`${environment.api}/requests`, { params })
      .pipe(
        tap((response) => {
          this.state.update((s) => ({ ...s, requests: response.data }));
        }),
        finalize(() => {
          this.state.update((s) => ({ ...s, isLoading: false })); 
        })
      );
  }

  // GET SINGLE REQUEST
  getRequestById(id: number) {
    return this.http.get<{ status: string; data: RequestItem }>(`${environment.api}/requests/${id}`);
  }

  // CREATE
  createRequest(payload: CreateRequestPayload) {
    return this.http.post<{ message: string; data: RequestItem }>(`${environment.api}/requests`, payload);
  }

  // UPDATE
  updateRequest(id: number, payload: Partial<CreateRequestPayload>) {
    return this.http.put<{ message: string; data: RequestItem }>(`${environment.api}/requests/${id}`, payload);
  }

  // DELETE
  deleteRequest(id: number) {
    return this.http.delete<{ message: string }>(`${environment.api}/requests/${id}`);
  }

  // TOGGLE VOTE (Love / Unlove)
  toggleVote(id: number) {
    return this.http.post<{ message: string; total_votes: number }>(`${environment.api}/requests/${id}/vote`, {});
  }
}