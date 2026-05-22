import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import AuthLayout from './auth-layout';
import { ButtonSizeDirective } from '../../shared/directives/button';

@Component({
  selector: 'sign-in-page',
  templateUrl: './sign-in-page.html',
  styleUrl: './sign-in-page.scss',
  imports: [MatButtonModule, MatIconModule, ButtonSizeDirective, RouterLink, AuthLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SignInPage {
  private readonly auth = inject(AuthService);
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
