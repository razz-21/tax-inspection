import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { PatchSettings, Settings } from '@tax-inspection/shared';
import { API_ENDPOINTS } from '../constants/api.constants';

/** App-wide settings (tax rate). */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  get(): Observable<Settings> {
    return this.http.get<Settings>(API_ENDPOINTS.settings);
  }

  update(body: PatchSettings): Observable<Settings> {
    return this.http.patch<Settings>(API_ENDPOINTS.settings, body);
  }
}
