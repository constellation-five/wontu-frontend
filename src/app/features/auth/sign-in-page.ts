import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../core/auth';
import { ActivatedRoute, RouterLink } from '@angular/router';
import AuthLayout from './auth-layout';

@Component({
  selector: 'sign-in-page',
  templateUrl: './sign-in-page.html',
  imports: [MatButtonModule, MatIconModule, RouterLink, AuthLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SignInPage {
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);

  signInWithGoogle() {
    let returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (!returnUrl || returnUrl.includes('/signin') || returnUrl.includes('/complete-signup')) {
      returnUrl = sessionStorage.getItem('authReturnUrl');
    }

    if (returnUrl && !returnUrl.includes('/signin') && !returnUrl.includes('/complete-signup')) {
      sessionStorage.setItem('authReturnUrl', returnUrl);
    } else {
      sessionStorage.removeItem('authReturnUrl');
    }

    this.auth.initializeCsrf().subscribe(() => {
      this.auth.googleRedirect();
    });
  }
}
