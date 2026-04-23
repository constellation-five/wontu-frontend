import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User } from './user';
import { catchError, map, of, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);

  private readonly state = signal<{
    user: User | null;
    isLoading: boolean;
  }>({
    user: null,
    isLoading: true,
  });

  readonly user = computed(() => this.state().user);
  readonly isLoading = computed(() => this.state().isLoading);

  initializeCsrf() {
    return this.http.get(`${environment.api}/sanctum/csrf-cookie`);
  }

  loadUser() {
    this.state.update((s) => ({ ...s, isLoading: true }));
    return this.http.get<User>(`${environment.api}/user`).pipe(
      tap((user) => {
        this.state.update((s) => ({ ...s, user, isLoading: false }));
      }),
      catchError(() => {
        this.state.update((s) => ({ ...s, user: null, isLoading: false }));
        return of(null);
      }),
    );
  }

  googleRedirect() {
    window.location.href = `${environment.api}/auth/google/redirect`;
  }

  getPendingUser() {
    return this.http.get<{
      google_id: string;
      name: string;
      email: string;
      avatar: string;
    }>(`${environment.api}/auth/google/pending-user`);
  }

  register(data: {
    google_id: string;
    name: string;
    email: string;
    avatar: string;
    username: string;
  }) {
    return this.http
      .post<{ message: string }>(`${environment.api}/auth/google/register`, data)
      .pipe(switchMap(() => this.loadUser()));
  }

  logout() {
    return this.http.post(`${environment.api}/auth/logout`, {}).pipe(
      tap(() => {
        this.state.update((s) => ({ ...s, user: null }));
      }),
    );
  }
}
