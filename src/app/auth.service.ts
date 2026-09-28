import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Mirrors the backend's user.role values (see services/user.service.ts's
// UserRole). Kept as a separate local alias rather than importing from
// user.service.ts so AuthService has no dependency on the user-management
// feature — this is the auth foundation's own view of "what role strings
// the backend can send us at login time".
export type AuthRole = 'ADMIN' | 'MANAGER' | 'ASSOCIATE';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: AuthRole;
}

export interface LoginSuccessResponse {
  requiresTwoFactor: false;
  accessToken: string;
  user: AuthUser;
}

export interface LoginChallengeResponse {
  requiresTwoFactor: true;
  challengeToken: string;
  user: AuthUser;
}

export type LoginResponse = LoginSuccessResponse | LoginChallengeResponse;

export interface VerifyLoginResponse {
  accessToken: string;
  user: AuthUser;
}

// Returned once by /2fa/setup. secret/otpAuthUri are sensitive setup
// material (otpAuthUri embeds the plaintext secret) — callers must hold
// these in memory only and never write them to storage or logs.
export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUrl: string;
}

export interface TwoFactorEnableResponse {
  success: true;
}

// AuthService is the single frontend owner of authentication state: it is
// the only place that talks to /api/auth/* and the only place that reads or
// writes the stored access token. Other services/components must go through
// getAccessToken()/isAuthenticated() rather than touching storage directly —
// this keeps a future HTTP interceptor's token source in one place.
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Points at the Node/Express API which talks to the Oracle database.
  // Update this if the API runs on a different host/port.
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  private readonly accessTokenKey = 'lumina-access-token';

  // Stored alongside the access token purely so the frontend page-access
  // layer (PageAccessService) has a real role to check instead of nothing —
  // it is NOT used for authentication decisions, never decoded from the JWT,
  // and is not itself treated as proof of anything the backend hasn't
  // already verified. Backend authorization remains authoritative.
  private readonly roleKey = 'lumina-user-role';

  // Stored the same way as role: the display name the backend returned at
  // login time, kept purely so the header can show who is signed in without
  // decoding the JWT or issuing an extra API call. Carries no authority.
  private readonly fullNameKey = 'lumina-user-name';

  // Mirrors whatever is currently in storage so route guards/UI can react
  // to auth state with a signal instead of re-reading storage each time.
  private readonly authenticated = signal(this.hasStoredAccessToken());

  constructor(private readonly http: HttpClient) {}

  /**
   * Step 1 of login: verifies username/password against the backend.
   * - If 2FA is disabled, the access token is already returned and stored.
   * - If 2FA is enabled, the response instead carries a short-lived
   *   challenge token; callers must hold it in memory only (never persist
   *   it) and pass it to verifyLogin() along with the TOTP code.
   */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((response) => {
        if (!response.requiresTwoFactor) {
          this.setAccessToken(response.accessToken, response.user.role, response.user.fullName);
        }
      })
    );
  }

  /**
   * Step 2 of login when 2FA is required: exchanges the in-memory challenge
   * token plus a 6-digit authenticator code for a real access token.
   */
  verifyLogin(challengeToken: string, twoFactorCode: string): Observable<VerifyLoginResponse> {
    return this.http
      .post<VerifyLoginResponse>(`${this.apiUrl}/verify-login`, { challengeToken, twoFactorCode })
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken, response.user.role, response.user.fullName);
        })
      );
  }

  /**
   * First-time 2FA enrollment step 1: asks the backend to generate a pending
   * TOTP secret for the current user and returns the QR/manual-entry
   * material needed to add it to an authenticator app. Requires an existing
   * access token; the interceptor attaches it, this method never does.
   */
  setupTwoFactor(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${this.apiUrl}/2fa/setup`, {});
  }

  /**
   * First-time 2FA enrollment step 2: confirms the pending secret from
   * setupTwoFactor() by submitting the 6-digit code the authenticator app
   * produced. On success, 2FA is enabled for this user going forward.
   */
  enableTwoFactor(code: string): Observable<TwoFactorEnableResponse> {
    return this.http.post<TwoFactorEnableResponse>(`${this.apiUrl}/2fa/enable`, { code });
  }

  /** Clears the stored access token and returns the app to a logged-out state. */
  logout(): void {
    this.clearAccessToken();
  }

  /** Signal-friendly authentication state, suitable for a future route guard. */
  isAuthenticated(): boolean {
    return this.authenticated();
  }

  /** The current access token, or null if the user is not authenticated. */
  getAccessToken(): string | null {
    if (!this.canUseStorage()) {
      return null;
    }
    return window.localStorage.getItem(this.accessTokenKey);
  }

  /**
   * The signed-in user's role, or null if unauthenticated. This is the value
   * the backend returned at login time — never decoded from the JWT — and
   * exists solely so the frontend page-access layer has something real to
   * check. It carries no authority of its own; the backend still enforces
   * every actual permission decision.
   */
  getCurrentRole(): AuthRole | null {
    if (!this.canUseStorage()) {
      return null;
    }
    return window.localStorage.getItem(this.roleKey) as AuthRole | null;
  }

  /**
   * The signed-in user's display name and role, for UI purposes only (e.g.
   * the header profile). Returns null when there is no authenticated user,
   * so callers can fall back to a generic placeholder rather than showing a
   * stale or invented identity.
   */
  getCurrentUserDisplay(): { fullName: string; role: AuthRole } | null {
    if (!this.canUseStorage()) {
      return null;
    }

    const fullName = window.localStorage.getItem(this.fullNameKey);
    const role = window.localStorage.getItem(this.roleKey) as AuthRole | null;

    if (!fullName || !role) {
      return null;
    }

    return { fullName, role };
  }

  private setAccessToken(accessToken: string, role: AuthRole, fullName: string): void {
    this.authenticated.set(true);

    if (!this.canUseStorage()) {
      return;
    }
    window.localStorage.setItem(this.accessTokenKey, accessToken);
    window.localStorage.setItem(this.roleKey, role);
    window.localStorage.setItem(this.fullNameKey, fullName);
  }

  private clearAccessToken(): void {
    this.authenticated.set(false);

    if (!this.canUseStorage()) {
      return;
    }
    window.localStorage.removeItem(this.accessTokenKey);
    window.localStorage.removeItem(this.roleKey);
    window.localStorage.removeItem(this.fullNameKey);
  }

  private hasStoredAccessToken(): boolean {
    if (!this.canUseStorage()) {
      return false;
    }
    return window.localStorage.getItem(this.accessTokenKey) !== null;
  }

  private canUseStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }
}
