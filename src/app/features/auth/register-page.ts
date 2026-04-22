import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { form, FormField, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'register-page',
  templateUrl: './register-page.html',
  imports: [FormField, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RegisterPage {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  readonly error = signal<string | null>(null);

  readonly googleUser = this.router.getCurrentNavigation()?.extras.state?.['google_user'];

  readonly model = signal({ username: '' });
  readonly form = form(this.model, (f) => {
    required(f.username);
  });

  constructor() {
    if (!this.googleUser) {
      this.router.navigate(['/sign-in']);
    }
  }

  submit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) return;

    this.auth
      .register({
        ...this.googleUser,
        username: this.model().username,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Registration failed');
        },
      });
  }
}
