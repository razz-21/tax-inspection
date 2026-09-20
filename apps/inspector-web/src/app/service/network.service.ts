import { Injectable, signal } from '@angular/core';

/**
 * Tracks browser connectivity. `online` reflects `navigator.onLine` and updates
 * on the window `online`/`offline` events. Used to decide whether a delivery is
 * submitted to the API or saved locally as a draft.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  /** True when the browser reports an active connection. */
  readonly online = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }
}
