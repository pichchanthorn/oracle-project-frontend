import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../auth.service';

// Matches the Lumina Diamond POS backend API only. Kept as a single literal
// (not a broader "attach to everything" rule) so the scope stays explicit
// and is easy to swap for an environment-based API URL later.
const LUMINA_API_BASE_URL = 'http://localhost:3000/api/';

// Public authentication endpoints must remain usable before the user has an
// access token, so they are excluded even though they fall under the base
// URL above — the backend does not require (or accept) a bearer token here.
const PUBLIC_AUTH_ENDPOINTS = [
  'http://localhost:3000/api/auth/login',
  'http://localhost:3000/api/auth/verify-login',
];

function isLuminaApiRequest(url: string): boolean {
  return url.startsWith(LUMINA_API_BASE_URL);
}

function isPublicAuthEndpoint(url: string): boolean {
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.startsWith(endpoint));
}

// Centralizes attaching the bearer access token to Lumina API requests, so
// individual services (UserService, ProductService, ...) never need to set
// Authorization headers themselves. AuthService remains the sole owner of
// token storage/access — this interceptor only reads getAccessToken() and
// forwards the request/response unchanged otherwise (no 401 handling, no
// refresh, no redirects here; that is out of scope for this task).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isLuminaApiRequest(req.url) || isPublicAuthEndpoint(req.url)) {
    return next(req);
  }

  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  if (!accessToken) {
    return next(req);
  }

  const authorizedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return next(authorizedReq);
};
