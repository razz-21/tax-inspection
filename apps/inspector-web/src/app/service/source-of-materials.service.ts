import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  GetSourceOfMaterialsResponse,
  PatchSourceOfMaterial,
  PostSourceOfMaterial,
  SourceOfMaterial,
} from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Logic + API calls for the source-of-materials entity. */
@Injectable({ providedIn: 'root' })
export class SourceOfMaterialsService {
  private readonly http = inject(HttpClient);

  list(): Observable<GetSourceOfMaterialsResponse> {
    return this.http.get<GetSourceOfMaterialsResponse>(
      API_ENDPOINTS.sourceOfMaterials,
    );
  }

  create(body: PostSourceOfMaterial): Observable<SourceOfMaterial> {
    return this.http.post<SourceOfMaterial>(
      API_ENDPOINTS.sourceOfMaterials,
      body,
    );
  }

  update(
    id: string,
    body: PatchSourceOfMaterial,
  ): Observable<SourceOfMaterial> {
    return this.http.patch<SourceOfMaterial>(
      `${API_ENDPOINTS.sourceOfMaterials}/${id}`,
      body,
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(
      `${API_ENDPOINTS.sourceOfMaterials}/${id}`,
    );
  }
}
