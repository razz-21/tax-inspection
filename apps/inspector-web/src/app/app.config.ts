import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { appRoutes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { SourceOfMaterialsStore } from './store/source-of-materials/source-of-materials.store';
import { ThemeService } from './service/theme.service';
import { PwaInstallService } from './service/pwa-install.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
    // Instantiate the store at startup so its `loggedIn` listener is active
    // before a field officer signs in (it prefetches material sources).
    provideAppInitializer(() => {
      inject(SourceOfMaterialsStore);
    }),
    // Apply the persisted color theme as early as possible.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
    // Start listening for the install prompt before any lazy page can miss it.
    provideAppInitializer(() => {
      inject(PwaInstallService);
    }),
    // Register the ngsw service worker for installable PWA + offline caching.
    // Disabled in dev; registers shortly after the app stabilises in production.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
