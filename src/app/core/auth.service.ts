import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { isProtectedRoute } from './routes.config';
import { NotificationService } from './notification.service';
import { ChatService } from './chat.service';
import { ThemeService } from './theme.service';
import { PushNotificationService } from './push-notification.service';

export interface User {
  user_id: string;
  name: string;
  email: string;
  username: string;
  google_id: string;
  avatar: string;
  language?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly chatService = inject(ChatService);
  private readonly themeService = inject(ThemeService);
  private readonly pushNotificationService = inject(PushNotificationService);

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
    return this.http
      .get<User>(`${environment.api}/user`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
      .pipe(
        switchMap((user) => {
          return this.http
            .get<{ data: { theme: 'system' | 'light' | 'dark' } }>(`${environment.api}/settings`, {
              withCredentials: true,
            })
            .pipe(
              tap((res) => {
                if (res.data && res.data.theme) {
                  this.themeService.setTheme(res.data.theme);
                }
              }),
              map(() => user),
              catchError(() => of(user)),
            );
        }),
        tap((user) => {
          this.state.update((s) => ({ ...s, user, isLoading: false }));
          this.notificationService.initialize(user.user_id);
          this.chatService.initialize(user.user_id);
          this.pushNotificationService.requestSubscriptionIfNeeded();

          if (user.language) {
            const currentLang = localStorage.getItem('language');
            if (currentLang !== user.language) {
              localStorage.setItem('language', user.language);
              const isId =
                window.location.pathname.startsWith('/id/') || window.location.pathname === '/id';
              if (user.language === 'id' && !isId) {
                window.location.replace('/id' + window.location.pathname + window.location.search);
              } else if (user.language === 'en' && isId) {
                const newPath = window.location.pathname.replace(/^\/id\/?/, '/') || '/';
                window.location.replace(newPath + window.location.search);
              }
            }
          }
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
        this.notificationService.teardown();
        this.chatService.teardown();
        if (isProtectedRoute(this.router.url)) {
          this.router.navigate(['/']);
        }
      }),
    );
  }
}
