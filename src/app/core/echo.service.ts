import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { ChannelAuthorizationData } from 'pusher-js/types/src/core/auth/options';
import { environment } from '../../environments/environment';

(window as any).Pusher = Pusher;

function getXsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

@Injectable({ providedIn: 'root' })
export class EchoService {
  private echo: Echo<'reverb'> | null = null;

  private getEcho(): Echo<'reverb'> {
    if (!this.echo) {
      this.echo = new Echo({
        broadcaster: 'reverb',
        key: environment.reverb.key,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssPort: environment.reverb.port,
        forceTLS: environment.reverb.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel: { name: string }) => ({
          authorize: (
            socketId: string,
            callback: (error: Error | null, data: ChannelAuthorizationData | null) => void,
          ) => {
            fetch(`${environment.api}/api/broadcasting/auth`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getXsrfToken(),
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })
              .then((res) => res.json())
              .then((data: ChannelAuthorizationData) => callback(null, data))
              .catch((err) => callback(err, null));
          },
        }),
      });
    }
    return this.echo;
  }

  listenToUserNotifications(userId: string, handler: (data: unknown) => void): void {
    this.getEcho()
      .private(`App.Models.User.${userId}`)
      .notification(handler);
  }

  listenToChatMessages(userId: string, handler: (data: unknown) => void): void {
    this.getEcho()
      .private(`App.Models.User.${userId}`)
      .listen('.chat.message', handler);
  }

  listenToOfferUpdates(offerId: string | number, handler: (data: unknown) => void): void {
    this.getEcho()
      .channel(`offers.${offerId}`)
      .listen('.OfferUpdated', handler);
  }

  leaveOfferChannel(offerId: string | number): void {
    if (this.echo) {
      this.echo.leave(`offers.${offerId}`);
    }
  }

  disconnect(): void {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }
  }
}
