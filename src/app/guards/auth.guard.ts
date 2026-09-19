import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

// Authentication-only gate for the protected POS application routes: "is
// there a signed-in user at all?" It defers entirely to AuthService for that
// answer (no localStorage access, no JWT inspection here) and never makes a
// role/permission decision — that is F-1.4's concern, not this guard's.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
