import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api.constants';
import { AuthService } from '../service/auth.service';

const isAuthEndpoint = (url: string): boolean =>
  url.includes(API_ENDPOINTS.login) || url.includes(API_ENDPOINTS.refresh);

const withBearer = (req: HttpRequest<unknown>, token: string | null) =>
  token && !isAuthEndpoint(req.url)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

/**
 * Attaches the access token to API requests and transparently recovers from an
 * expired token: on a 401 it exchanges the refresh token for a new access
 * token and retries the request once. Auth endpoints (login/refresh) are
 * skipped, and a failed refresh clears the session and returns to login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(withBearer(req, auth.accessToken())).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      // Access token likely expired — refresh once and replay the request.
      return auth.refreshAccessToken().pipe(
        switchMap((token) => next(withBearer(req, token))),
        catchError((refreshError) => {
          void router.navigateByUrl('/');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
