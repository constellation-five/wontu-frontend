import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Auth } from './core/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly title = signal('wontu-frontend');
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  ngOnInit() {
    const returnUrl = sessionStorage.getItem('authReturnUrl');
    if (returnUrl && this.auth.user()) {
      sessionStorage.removeItem('authReturnUrl');
      // Use navigateByUrl in next tick to avoid racing initial navigation
      setTimeout(() => {
        this.router.navigateByUrl(returnUrl);
      });
    }
  }
}
