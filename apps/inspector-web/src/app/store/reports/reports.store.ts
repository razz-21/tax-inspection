import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type { GetReport, ReportRow } from '@tax-inspection/shared';
import { ReportsService } from '../../service/reports.service';
import { authEvents } from '../auth/auth.events';
import { reportsApiEvents, reportsPageEvents } from './reports.events';

interface ReportsState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
  filter: GetReport;
  rows: ReportRow[];
}

const now = new Date();
const initialState: ReportsState = {
  loading: false,
  loaded: false,
  error: null,
  filter: { month: now.getMonth() + 1, year: now.getFullYear() },
  rows: [],
};

export const ReportsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ rows }) => ({
    count: computed(() => rows().length),
    totalQuantity: computed(() =>
      rows().reduce((sum, r) => sum + (r.quantity ?? 0), 0),
    ),
  })),
  withReducer(
    on(reportsPageEvents.opened, (_event, state) =>
      state.loaded ? {} : { loading: true, error: null },
    ),
    on(reportsPageEvents.reloaded, () => ({ loading: true, error: null })),
    on(reportsPageEvents.filterChanged, ({ payload }) => ({
      loading: true,
      error: null,
      filter: payload,
    })),
    on(reportsApiEvents.loadedSuccess, ({ payload }) => ({
      loading: false,
      loaded: true,
      rows: payload,
    })),
    on(reportsApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    on(authEvents.loggedOut, () => initialState),
  ),
  withHooks({
    onInit(
      store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(ReportsService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      const load = () =>
        service.list(store.filter()).pipe(
          mapResponse({
            next: (res) => reportsApiEvents.loadedSuccess(res),
            error: (err: Error) =>
              reportsApiEvents.loadedFailure(
                err.message || 'Failed to load report',
              ),
          }),
        );

      // Initial load — skip when already cached.
      events
        .on(reportsPageEvents.opened)
        .pipe(filter(() => !store.loaded()), switchMap(load), takeUntilDestroyed())
        .subscribe(dispatch);

      // Reload / filter change — always refetch.
      events
        .on(reportsPageEvents.reloaded, reportsPageEvents.filterChanged)
        .pipe(switchMap(load), takeUntilDestroyed())
        .subscribe(dispatch);
    },
  }),
);
