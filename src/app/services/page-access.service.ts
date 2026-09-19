import { Injectable } from '@angular/core';

import { AuthRole, AuthService } from '../auth.service';

/**
 * Stable, route-independent identifiers for the pages that page-level
 * access control applies to. These are NOT URL strings — a route's path
 * can change without ever touching a page code, and a page code is what a
 * future backend permission/navigation table would key on.
 *
 * Naming convention: uppercase, singular concept per page, one entry per
 * protected route. Add new codes here as new protected pages are added.
 */
export type PageCode = 'DASHBOARD' | 'UNITS' | 'CATEGORIES' | 'INGREDIENTS' | 'PRODUCTS' | 'USERS';

/**
 * PageAccessService — the single frontend abstraction that answers
 * "can the current user view this page?"
 *
 * This is a UX/navigation convenience layer only. It is NOT a security
 * boundary: the backend API is the authoritative enforcement point for
 * every request, and this service must never be treated as proof that an
 * action is actually allowed. Its only job is to steer an authenticated-but-
 * unauthorized user to /forbidden instead of letting them land on a page
 * whose data calls will fail anyway.
 *
 * TEMPORARY DATA SOURCE: Lumina does not yet have a backend
 * navigation/permission API (unlike the reference implementation this was
 * modeled after, which calls one). Until that exists, access is decided
 * from a small static role -> pageCode matrix below. That matrix is the
 * only thing a future backend-driven implementation needs to replace —
 * canViewPage()'s signature and every caller (pageAccessGuard, route data)
 * stay the same, so swapping this for a real API call later requires no
 * routing changes.
 */
@Injectable({ providedIn: 'root' })
export class PageAccessService {
  // Every page reachable by any authenticated role is listed here so the
  // matrix stays the single source of truth — there is no implicit "allow
  // by default" path. ADMIN and MANAGER currently see the same pages;
  // ASSOCIATE is withheld from User Management (account administration),
  // which is the only access distinction the current project actually
  // implies (see services/user.service.ts's UserRole and the backend's
  // user-management routes) — nothing beyond that is invented here.
  private readonly accessMatrix: Record<PageCode, ReadonlyArray<AuthRole>> = {
    DASHBOARD: ['ADMIN', 'MANAGER', 'ASSOCIATE'],
    UNITS: ['ADMIN', 'MANAGER', 'ASSOCIATE'],
    CATEGORIES: ['ADMIN', 'MANAGER', 'ASSOCIATE'],
    INGREDIENTS: ['ADMIN', 'MANAGER', 'ASSOCIATE'],
    PRODUCTS: ['ADMIN', 'MANAGER', 'ASSOCIATE'],
    USERS: ['ADMIN', 'MANAGER'],
  };

  constructor(private readonly authService: AuthService) {}

  /**
   * Returns whether the current user may view the given page. Fails closed
   * (false) whenever the role is unknown/missing or the page code isn't in
   * the matrix — it never defaults to allowing access on uncertainty.
   */
  canViewPage(pageCode: PageCode): boolean {
    const role = this.authService.getCurrentRole();

    if (!role) {
      return false;
    }

    const allowedRoles = this.accessMatrix[pageCode];
    if (!allowedRoles) {
      return false;
    }

    return allowedRoles.includes(role);
  }
}
