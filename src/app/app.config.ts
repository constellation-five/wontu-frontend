import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  inject,
  provideAppInitializer,
  isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from './core/auth.service';
import { TransitionDirectionService } from './core/transition-direction.service';

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/credentials.interceptor';

import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      inject(TransitionDirectionService);
      return auth.loadUser();
    }),
    { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } },
    provideServiceWorker('/ngsw-worker.js', {
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
