import { ApplicationRef, Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

/** How often to poll for a new deployment once the app is running. */
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Watches for new app versions delivered by the service worker and prompts the
 * user to reload. Also polls periodically so long-lived sessions (e.g. an
 * installed desktop window left open) pick up deployments without a manual
 * refresh. No-ops when the service worker is disabled (dev / unsupported).
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    // A newer version has been downloaded and is ready to activate.
    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.promptReload());

    // The cached app is broken (e.g. files evicted) and cannot recover.
    this.swUpdate.unrecoverable.subscribe(() => {
      toast.error('The app needs to reload to continue.', {
        duration: Infinity,
        action: { label: 'Reload', onClick: () => this.reload() },
      });
    });

    // Check on first stability, then on a fixed interval afterwards.
    const appStable$ = this.appRef.isStable.pipe(first((stable) => stable));
    const poll$ = interval(UPDATE_CHECK_INTERVAL_MS);
    concat(appStable$, poll$).subscribe(() => this.checkForUpdate());
  }

  private checkForUpdate(): void {
    // Ignore failures — usually just offline or a transient network error.
    this.swUpdate.checkForUpdate().catch(() => undefined);
  }

  /**
   * Drop cached API responses (the ngsw `dataGroups` caches) so a different
   * user signing in on the same device can never read the previous user's data
   * offline. Leaves the app-shell/asset caches intact. Call this on logout.
   */
  async clearApiCache(): Promise<void> {
    if (!('caches' in window)) return;
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.includes(':data:'))
        .map((key) => caches.delete(key)),
    );
  }

  private promptReload(): void {
    toast('A new version is available', {
      description: 'Reload to get the latest features and fixes.',
      duration: Infinity,
      action: { label: 'Reload', onClick: () => this.reload() },
    });
  }

  private async reload(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
    } finally {
      document.location.reload();
    }
  }
}
