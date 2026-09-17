import type { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Logs failed HTTP responses and rethrows so callers can handle them. */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error) => {
      console.error(`[HTTP ${error.status ?? '?'}] ${req.method} ${req.url}`, error);
      return throwError(() => error);
    }),
  );
