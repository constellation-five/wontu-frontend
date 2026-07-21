import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.listenToNotificationClicks();
  }

  public requestSubscriptionIfNeeded(): void {
    if (!this.swPush.isEnabled) {
      return;
    }

    if (Notification.permission === 'denied') {
      this.snackBar.open(
        $localize`:@@pushNotification.blocked:Push notifications are blocked in your browser settings. Please enable them to receive notifications.`,
        'OK',
        { duration: 5000 }
      );
      return;
    }

    if (Notification.permission === 'default' || Notification.permission === 'granted') {
      this.swPush
        .requestSubscription({
          serverPublicKey: environment.vapidPublicKey,
        })
        .then((subscription) => {
          this.http
            .post(`${environment.api}/push-subscriptions`, subscription)
            .subscribe({
              error: (err) => console.error('Failed to save push subscription on server', err)
            });
        })
        .catch((err) => {
          console.error('Failed to get push subscription', err);
        });
    }
  }

  public unsubscribe(): void {
    if (!this.swPush.isEnabled) {
      return;
    }

    this.swPush.subscription.subscribe(sub => {
      if (sub) {
        this.http.delete(`${environment.api}/push-subscriptions`, { body: { endpoint: sub.endpoint } }).subscribe();
        sub.unsubscribe().catch(err => console.error('Failed to unsubscribe', err));
      }
    });
  }

  private listenToNotificationClicks(): void {
    if (!this.swPush.isEnabled) {
      return;
    }

    this.swPush.notificationClicks.subscribe(({ action, notification }) => {
      const url = notification.data?.url;
      if (url) {
        this.router.navigateByUrl(url);
      }
    });
  }
}
