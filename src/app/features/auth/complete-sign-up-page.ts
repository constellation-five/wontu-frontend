import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { form, FormField, required, readonly } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'complete-sign-up-page',
  templateUrl: './complete-sign-up-page.html',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CompleteSignUpPage implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  readonly error = signal<string | null>(null);
  readonly fetchingUser = signal(true);

  readonly model = signal({
    google_id: '',
    name: '',
    email: '',
    avatar: '',
    username: '',
  });

  readonly form = form(this.model, (f) => {
    required(f.username);
    readonly(f.email);
  });

  ngOnInit() {
    this.auth.getPendingUser().subscribe({
      next: (user) => {
        this.model.update((m) => ({
          ...m,
          google_id: user.google_id || '',
          name: user.name || '',
          email: user.email || '',
          avatar: user.avatar || '',
        }));
        this.fetchingUser.set(false);
      },
      error: () => {
        this.router.navigate(['/signin']);
      },
    });
  }

  submit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) return;

    this.auth.register(this.model()).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Registration failed');
      },
    });
  }
}
