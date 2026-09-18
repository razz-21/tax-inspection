import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  DeliveryInspection,
  GetDeliveryInspections,
  GetDeliveryInspectionsResponse,
  PostDeliveryInspection,
} from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Logic + API calls for the delivery-inspections entity. */
@Injectable({ providedIn: 'root' })
export class DeliveryInspectionsService {
  private readonly http = inject(HttpClient);

  list(
    query: Partial<GetDeliveryInspections> = {},
  ): Observable<GetDeliveryInspectionsResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<GetDeliveryInspectionsResponse>(
      API_ENDPOINTS.deliveryInspections,
      { params },
    );
  }

  getById(id: string): Observable<DeliveryInspection> {
    return this.http.get<DeliveryInspection>(
      `${API_ENDPOINTS.deliveryInspections}/${id}`,
    );
  }

  create(body: PostDeliveryInspection): Observable<DeliveryInspection> {
    return this.http.post<DeliveryInspection>(
      API_ENDPOINTS.deliveryInspections,
      body,
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(
      `${API_ENDPOINTS.deliveryInspections}/${id}`,
    );
  }
}
