import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { GetReport, GetReportResponse } from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Tax inspection report derived from deliveries. */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);

  list(query: GetReport): Observable<GetReportResponse> {
    const params = new HttpParams()
      .set('month', String(query.month))
      .set('year', String(query.year));
    return this.http.get<GetReportResponse>(API_ENDPOINTS.reports, { params });
  }
}
