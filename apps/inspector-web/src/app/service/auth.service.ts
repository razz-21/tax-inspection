import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  finalize,
  map,
  shareReplay,
  tap,
  throwError,
  type Observable,
} from 'rxjs';
import type {
  Login,
  LoginResponse,
  PublicUser,
  RefreshRequest,
  RefreshResponse,
} from '@tax-inspection/shared';
import { Dispatcher } from '@ngrx/signals/events';
import { API_ENDPOINTS } from '../constants/api.constants';
import { MeStore } from '../store/me/me.store';
import { authEvents } from '../store/auth/auth.events';

/** Authentication API calls. Session state lives in {@link MeStore}. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly me = inject(MeStore);
  private readonly dispatcher = inject(Dispatcher);

  /** The signed-in user, or `null` when logged out. */
  readonly currentUser = this.me.user;
  readonly isAuthenticated = this.me.isAuthenticated;
  /** Current JWT access token, or `null` when logged out. */
  readonly accessToken = this.me.accessToken;

  /** Shared in-flight refresh so concurrent 401s trigger only one call. */
  private refreshInFlight: Observable<string> | null = null;

  /**
   * Attempt to sign in. Resolves with the authenticated user on success and
   * stores the user + tokens in {@link MeStore}; the observable errors
   * (HttpErrorResponse) when the API rejects the credentials or the account
   * status forbids login.
   */
  login(credentials: Login): Observable<PublicUser> {
    return this.http
      .post<LoginResponse>(API_ENDPOINTS.login, credentials)
      .pipe(
        tap((res) => {
          this.me.setSession(res.user, res.accessToken, res.refreshToken);
          // Broadcast so feature stores can prefetch data for this user.
          this.dispatcher.dispatch(authEvents.loggedIn(res.user));
        }),
        map((res) => res.user),
      );
  }

  /**
   * Exchange the stored refresh token for a fresh access token. Multiple
   * callers share a single request; on failure the session is cleared.
   */
  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const refreshToken = this.me.refreshToken();
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    const body: RefreshRequest = { refreshToken };
    this.refreshInFlight = this.http
      .post<RefreshResponse>(API_ENDPOINTS.refresh, body)
      .pipe(
        map((res) => res.accessToken),
        tap((accessToken) => this.me.setAccessToken(accessToken)),
        catchError((err) => {
          this.clearSession();
          return throwError(() => err);
        }),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );

    return this.refreshInFlight;
  }

  logout(): void {
    this.clearSession();
  }

  /**
   * Clear the session and broadcast `loggedOut` so feature stores drop any
   * cached data from the previous user.
   */
  private clearSession(): void {
    this.me.clear();
    this.dispatcher.dispatch(authEvents.loggedOut());
  }
}
