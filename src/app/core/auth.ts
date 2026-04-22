import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User } from './user';
import { catchError, map, of, switchMap, tap } from 'rxjs';

export interface GoogleAuthResponse {
  message: string;
  user?: User;
  action?: 'register';
  google_user?: {
    google_id: string;
    name: string;
    email: string;
    avatar: string;
  };
}

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

  loadUser() {
    this.state.update((s) => ({ ...s, isLoading: true }));
    return this.http
      .get<User>(`${environment.api}/user`)
      .pipe(
        tap((user) => {
          this.state.update((s) => ({ ...s, user, isLoading: false }));
        }),
        catchError(() => {
          this.state.update((s) => ({ ...s, user: null, isLoading: false }));
          return of(null);
        }),
      )
      .subscribe();
  }

  googleRedirect() {
    // Window redirect
    window.location.href = `${environment.api}/auth/google/redirect`;
  }

  googleCallback(queryParams: string) {
    return this.http
      .get<GoogleAuthResponse>(`${environment.api}/auth/google/callback${queryParams}`)
      .pipe(
        tap((res) => {
          if (res.user) {
            this.state.update((s) => ({ ...s, user: res.user! }));
          }
        }),
      );
  }

  register(data: {
    google_id: string;
    name: string;
    email: string;
    avatar: string;
    username: string;
  }) {
    return this.http.get(`${environment.api}/sanctum/csrf-cookie`).pipe(
      switchMap(() =>
        this.http.post<{ message: string; user: User }>(
          `${environment.api}/auth/google/register`,
          data,
        ),
      ),
      tap((res) => {
        if (res.user) {
          this.state.update((s) => ({ ...s, user: res.user }));
        }
      }),
    );
  }

  logout() {
    return this.http.post(`${environment.api}/auth/logout`, {}).pipe(
      tap(() => {
        this.state.update((s) => ({ ...s, user: null }));
      }),
    );
  }
}
