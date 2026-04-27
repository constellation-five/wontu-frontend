import { HttpInterceptorFn, HttpXsrfTokenExtractor } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.api)) {
    const tokenExtractor = inject(HttpXsrfTokenExtractor);
    const token = tokenExtractor.getToken();

    let cloned = req.clone({
      withCredentials: true,
      setHeaders: {
        Accept: 'application/json',
      },
    });

    if (token && req.method !== 'GET' && req.method !== 'HEAD') {
      cloned = cloned.clone({
        setHeaders: { 'X-XSRF-TOKEN': token },
      });
    }

    return next(cloned);
  }
  return next(req);
};
