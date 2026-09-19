import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { DashboardRange, DashboardSummary } from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Aggregated dashboard read model. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  get(range: DashboardRange): Observable<DashboardSummary> {
    const params = new HttpParams().set('range', range);
    return this.http.get<DashboardSummary>(API_ENDPOINTS.dashboard, { params });
  }
}
