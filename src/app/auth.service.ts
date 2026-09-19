import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
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
          this.setAccessToken(response.accessToken);
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
          this.setAccessToken(response.accessToken);
        })
      );
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

  private setAccessToken(accessToken: string): void {
    this.authenticated.set(true);

    if (!this.canUseStorage()) {
      return;
    }
    window.localStorage.setItem(this.accessTokenKey, accessToken);
  }

  private clearAccessToken(): void {
    this.authenticated.set(false);

    if (!this.canUseStorage()) {
      return;
    }
    window.localStorage.removeItem(this.accessTokenKey);
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
