import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { signalStore, withHooks, withState } from '@ngrx/signals';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type { AnalyticsRange, AnalyticsSummary } from '@tax-inspection/shared';
import { AnalyticsService } from '../../service/analytics.service';
import { authEvents } from '../auth/auth.events';
import { analyticsApiEvents, analyticsPageEvents } from './analytics.events';

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  range: AnalyticsRange;
  summary: AnalyticsSummary | null;
}

const initialState: AnalyticsState = {
  loading: false,
  error: null,
  range: 'this_year',
  summary: null,
};

export const AnalyticsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  // State transitions driven purely by events.
  withReducer(
    on(analyticsPageEvents.opened, analyticsPageEvents.reloaded, () => ({
      loading: true,
      error: null,
    })),
    on(analyticsPageEvents.rangeChanged, ({ payload }) => ({
      loading: true,
      error: null,
      range: payload,
    })),
    on(analyticsApiEvents.loadedSuccess, ({ payload }) => ({
      loading: false,
      summary: payload,
    })),
    on(analyticsApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    // Drop cached data when the user logs out.
    on(authEvents.loggedOut, () => initialState),
  ),
  // Side effects: listen for UI events, call the API, dispatch API events.
  withHooks({
    onInit(
      store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(AnalyticsService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      events
        .on(
          analyticsPageEvents.opened,
          analyticsPageEvents.reloaded,
          analyticsPageEvents.rangeChanged,
        )
        .pipe(
          switchMap(() =>
            service.get(store.range()).pipe(
              mapResponse({
                next: (res) => analyticsApiEvents.loadedSuccess(res),
                error: (err: Error) =>
                  analyticsApiEvents.loadedFailure(
                    err.message || 'Failed to load analytics',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);
    },
  }),
);
