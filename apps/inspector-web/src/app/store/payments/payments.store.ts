import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import {
  removeAllEntities,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type {
  GetPayments,
  PaginationMeta,
  Payment,
} from '@tax-inspection/shared';
import { PaymentsService } from '../../service/payments.service';
import { authEvents } from '../auth/auth.events';
import { paymentsApiEvents, paymentsPageEvents } from './payments.events';

interface PaymentsState {
  loading: boolean;
  /** True once the list has been fetched at least once (cache guard). */
  loaded: boolean;
  error: string | null;
  query: Partial<GetPayments>;
  meta: PaginationMeta | null;
}

const initialState: PaymentsState = {
  loading: false,
  loaded: false,
  error: null,
  // Newest payments first.
  query: { page: 1, limit: 12, sortBy: 'created_at', sortOrder: 'desc' },
  meta: null,
};

export const PaymentsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<Payment>(),
  withComputed(({ entities, meta }) => ({
    total: computed(() => meta()?.total ?? entities().length),
  })),
  // State transitions driven purely by events.
  withReducer(
    // Initial open only shows the loading state when nothing is cached yet.
    on(paymentsPageEvents.opened, (_event, state) =>
      state.loaded ? {} : { loading: true, error: null },
    ),
    on(paymentsPageEvents.reloaded, () => ({ loading: true, error: null })),
    on(paymentsPageEvents.queryChanged, (event, state) => ({
      loading: true,
      error: null,
      query: { ...state.query, ...event.payload },
    })),
    on(paymentsApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload.data),
      { loading: false, loaded: true, meta: payload.meta },
    ]),
    on(paymentsApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    // Drop cached payments when the user logs out.
    on(authEvents.loggedOut, () => [removeAllEntities(), initialState]),
  ),
  // Side effects: listen for UI events, call the API, dispatch API events.
  withHooks({
    onInit(
      store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(PaymentsService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      const loadList = () =>
        service.list(store.query()).pipe(
          mapResponse({
            next: (res) => paymentsApiEvents.loadedSuccess(res),
            error: (err: Error) =>
              paymentsApiEvents.loadedFailure(
                err.message || 'Failed to load payments',
              ),
          }),
        );

      // Initial load — skip the API call when the list is already cached.
      events
        .on(paymentsPageEvents.opened)
        .pipe(
          filter(() => !store.loaded()),
          switchMap(loadList),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Reload / query change — always refetch.
      events
        .on(paymentsPageEvents.reloaded, paymentsPageEvents.queryChanged)
        .pipe(switchMap(loadList), takeUntilDestroyed())
        .subscribe(dispatch);
    },
  }),
);
