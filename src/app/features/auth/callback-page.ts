import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

@Component({
  selector: 'auth-callback-page',
  templateUrl: './callback-page.html',
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthCallbackPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  readonly error = signal<string | null>(null);

  constructor() {
    this.route.queryParams.pipe(take(1), takeUntilDestroyed()).subscribe((params) => {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();

      this.auth.googleCallback('?' + queryString).subscribe({
        next: (res) => {
          if (res.action === 'register') {
            // Need to pass data to register page
            this.router.navigate(['/auth/register'], {
              state: { google_user: res.google_user },
            });
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.error.set(err.message || 'Authentication failed.');
        },
      });
    });
  }
}
