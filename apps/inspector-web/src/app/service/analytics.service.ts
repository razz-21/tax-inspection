import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { AnalyticsRange, AnalyticsSummary } from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Aggregated analytics read model. */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  get(range: AnalyticsRange): Observable<AnalyticsSummary> {
    const params = new HttpParams().set('range', range);
    return this.http.get<AnalyticsSummary>(API_ENDPOINTS.analytics, { params });
  }
}
