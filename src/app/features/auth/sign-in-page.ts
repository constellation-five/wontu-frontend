import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../core/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sign-in-page',
  templateUrl: './sign-in-page.html',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SignInPage {
  private readonly auth = inject(Auth);

  signInWithGoogle() {
    this.auth.googleRedirect();
  }
}
