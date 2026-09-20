import { Injectable, signal } from '@angular/core';

/**
 * The (non-standard) event Chromium browsers fire when a site meets the
 * installability criteria. We hold on to it so the user can trigger the native
 * install prompt on demand (e.g. from Profile & Settings).
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

/**
 * Tracks PWA installability and lets the UI trigger the browser's install
 * prompt. Instantiated at startup so the `beforeinstallprompt` event (which can
 * fire before any lazy page loads) is never missed.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  /** True once the browser has offered installation (Chromium/Edge/Android). */
  readonly canInstall = signal(false);
  /** True when running as an installed standalone app rather than a tab. */
  readonly isInstalled = signal(this.detectStandalone());

  constructor() {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Stop the default mini-infobar; we surface our own button instead.
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
    });
  }

  /**
   * Show the native install prompt. Returns `unavailable` when the browser has
   * not offered installation (already installed, unsupported, or iOS Safari,
   * which requires the manual Share → Add to Home Screen flow).
   */
  async promptInstall(): Promise<InstallOutcome> {
    const event = this.deferredPrompt;
    if (!event) return 'unavailable';

    await event.prompt();
    const { outcome } = await event.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);
    return outcome;
  }

  private detectStandalone(): boolean {
    const iosStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true;
    return (
      window.matchMedia?.('(display-mode: standalone)').matches || iosStandalone
    );
  }
}
