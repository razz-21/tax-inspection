import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  GetUsers,
  GetUsersResponse,
  PatchUser,
  PostUser,
  PublicUser,
} from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** Logic + API calls for the users entity. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  list(query: Partial<GetUsers> = {}): Observable<GetUsersResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<GetUsersResponse>(API_ENDPOINTS.users, { params });
  }

  getById(id: string): Observable<PublicUser> {
    return this.http.get<PublicUser>(`${API_ENDPOINTS.users}/${id}`);
  }

  create(body: PostUser): Observable<PublicUser> {
    return this.http.post<PublicUser>(API_ENDPOINTS.users, body);
  }

  update(id: string, body: PatchUser): Observable<PublicUser> {
    return this.http.patch<PublicUser>(`${API_ENDPOINTS.users}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.users}/${id}`);
  }
}
