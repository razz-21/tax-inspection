import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  GetPayments,
  GetPaymentsResponse,
  PatchPayment,
  Payment,
  PostPayment,
} from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Logic + API calls for the payments entity. */
@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);

  list(query: Partial<GetPayments> = {}): Observable<GetPaymentsResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<GetPaymentsResponse>(API_ENDPOINTS.payments, {
      params,
    });
  }

  getById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${API_ENDPOINTS.payments}/${id}`);
  }

  create(body: PostPayment): Observable<Payment> {
    return this.http.post<Payment>(API_ENDPOINTS.payments, body);
  }

  update(id: string, body: PatchPayment): Observable<Payment> {
    return this.http.patch<Payment>(`${API_ENDPOINTS.payments}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.payments}/${id}`);
  }
}
