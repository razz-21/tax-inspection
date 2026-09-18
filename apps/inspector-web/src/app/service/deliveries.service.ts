import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  Delivery,
  GetDeliveries,
  GetDeliveriesResponse,
  PatchDelivery,
  PostDelivery,
} from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Logic + API calls for the deliveries entity. */
@Injectable({ providedIn: 'root' })
export class DeliveriesService {
  private readonly http = inject(HttpClient);

  list(query: Partial<GetDeliveries> = {}): Observable<GetDeliveriesResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<GetDeliveriesResponse>(API_ENDPOINTS.deliveries, {
      params,
    });
  }

  getById(id: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${API_ENDPOINTS.deliveries}/${id}`);
  }

  create(body: PostDelivery): Observable<Delivery> {
    return this.http.post<Delivery>(API_ENDPOINTS.deliveries, body);
  }

  update(id: string, body: PatchDelivery): Observable<Delivery> {
    return this.http.patch<Delivery>(
      `${API_ENDPOINTS.deliveries}/${id}`,
      body,
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.deliveries}/${id}`);
  }
}
