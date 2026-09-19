import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { signalStore, withHooks, withState } from '@ngrx/signals';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type { DashboardRange, DashboardSummary } from '@tax-inspection/shared';
import { DashboardService } from '../../service/dashboard.service';
import { authEvents } from '../auth/auth.events';
import { dashboardApiEvents, dashboardPageEvents } from './dashboard.events';

interface DashboardState {
  loading: boolean;
  error: string | null;
  range: DashboardRange;
  summary: DashboardSummary | null;
}

const initialState: DashboardState = {
  loading: false,
  error: null,
  range: 'this_week',
  summary: null,
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  // State transitions driven purely by events.
  withReducer(
    on(dashboardPageEvents.opened, dashboardPageEvents.reloaded, () => ({
      loading: true,
      error: null,
    })),
    on(dashboardPageEvents.rangeChanged, ({ payload }) => ({
      loading: true,
      error: null,
      range: payload,
    })),
    on(dashboardApiEvents.loadedSuccess, ({ payload }) => ({
      loading: false,
      summary: payload,
    })),
    on(dashboardApiEvents.loadedFailure, ({ payload }) => ({
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
      service = inject(DashboardService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      events
        .on(
          dashboardPageEvents.opened,
          dashboardPageEvents.reloaded,
          dashboardPageEvents.rangeChanged,
        )
        .pipe(
          switchMap(() =>
            service.get(store.range()).pipe(
              mapResponse({
                next: (res) => dashboardApiEvents.loadedSuccess(res),
                error: (err: Error) =>
                  dashboardApiEvents.loadedFailure(
                    err.message || 'Failed to load dashboard',
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
