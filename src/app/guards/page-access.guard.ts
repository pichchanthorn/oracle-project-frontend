import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { PageAccessService, PageCode } from '../services/page-access.service';

// Authorization-only gate: "is the already-authenticated user allowed to
// view THIS page?" This must run after authGuard (authGuard answers "is
// there a user at all?"); it never touches AuthService's token/authenticated
// state itself and never redirects to /login — an authorization failure is
// a 403 concept (/forbidden), not a 401 concept.
//
// Reads the page code from the route's own `data.pageCode` rather than the
// URL, so the identifier a permission table would key on never depends on
// how a route happens to be named.
export const pageAccessGuard: CanActivateFn = (route) => {
  const pageAccessService = inject(PageAccessService);
  const router = inject(Router);

  const pageCode = route.data['pageCode'] as PageCode | undefined;

  // Fail closed: a protected route with no pageCode configured is a
  // frontend configuration error, not a reason to let the request through.
  if (!pageCode) {
    return router.createUrlTree(['/forbidden']);
  }

  try {
    if (pageAccessService.canViewPage(pageCode)) {
      return true;
    }
  } catch {
    // Any unexpected internal error while determining access is treated the
    // same as "not allowed" — never silently grant access on failure.
  }

  return router.createUrlTree(['/forbidden']);
};
