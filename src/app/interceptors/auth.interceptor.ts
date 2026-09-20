import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

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

// Module-level (not per-call) so it is shared across every concurrent
// request this interceptor handles: if several protected requests 401 at
// once, only the first one triggers logout()/navigation — the rest see this
// already true and skip straight to re-throwing. Reset once the redirect
// itself has been issued, not on a timer, so a later genuine session
// expiry can still trigger the flow again.
let isHandlingSessionExpiry = false;

// Centralizes attaching the bearer access token to Lumina API requests, so
// individual services (UserService, ProductService, ...) never need to set
// Authorization headers themselves. AuthService remains the sole owner of
// token storage/access — this interceptor only reads getAccessToken().
//
// It also centralizes the session-expiry reaction to a 401 from a protected
// Lumina API request: logout() + redirect to /login, then re-throw so
// existing component-level error handlers still run unchanged. A 403 is
// left completely untouched here — it is an authorization (not
// authentication) outcome, so the existing session/token must survive it;
// PageAccessService/pageAccessGuard and each component's own 403 handling
// remain the only things that react to it. The two public auth endpoints
// are excluded from this reaction the same way they are already excluded
// from having a token attached — a wrong password or an invalid/expired 2FA
// challenge must never log out a user who was never logged in yet.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isProtectedLuminaRequest = isLuminaApiRequest(req.url) && !isPublicAuthEndpoint(req.url);

  let outgoingReq = req;

  if (isProtectedLuminaRequest && !req.headers.has('Authorization')) {
    const accessToken = authService.getAccessToken();

    if (accessToken) {
      outgoingReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  }

  return next(outgoingReq).pipe(
    catchError((error: unknown) => {
      if (
        isProtectedLuminaRequest &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isHandlingSessionExpiry
      ) {
        isHandlingSessionExpiry = true;
        authService.logout();

        if (router.url !== '/login') {
          void router.navigateByUrl('/login').finally(() => {
            isHandlingSessionExpiry = false;
          });
        } else {
          isHandlingSessionExpiry = false;
        }
      }

      return throwError(() => error);
    })
  );
};
