import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { Inspection } from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Logic + API calls for the inspections entity. */
@Injectable({ providedIn: 'root' })
export class InspectionsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Inspection[]> {
    return this.http.get<Inspection[]>(API_ENDPOINTS.inspections);
  }

  getById(id: string): Observable<Inspection> {
    return this.http.get<Inspection>(`${API_ENDPOINTS.inspections}/${id}`);
  }
}
