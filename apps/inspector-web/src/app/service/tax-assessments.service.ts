import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  GetTaxAssessments,
  GetTaxAssessmentsResponse,
  TaxAssessment,
} from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Logic + API calls for the tax-assessments entity. */
@Injectable({ providedIn: 'root' })
export class TaxAssessmentsService {
  private readonly http = inject(HttpClient);

  list(
    query: Partial<GetTaxAssessments> = {},
  ): Observable<GetTaxAssessmentsResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<GetTaxAssessmentsResponse>(
      API_ENDPOINTS.taxAssessments,
      { params },
    );
  }

  /** Compute and persist a tax assessment for a delivery. */
  calculate(deliveryId: string): Observable<TaxAssessment> {
    return this.http.post<TaxAssessment>(
      `${API_ENDPOINTS.taxAssessments}/calculate`,
      { delivery_id: deliveryId },
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.taxAssessments}/${id}`);
  }
}
