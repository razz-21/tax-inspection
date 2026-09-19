import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import {
  removeAllEntities,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type {
  Delivery,
  GetDeliveries,
  PaginationMeta,
} from '@tax-inspection/shared';
import { DeliveriesService } from '../../service/deliveries.service';
import { authEvents } from '../auth/auth.events';
import {
  deliveriesApiEvents,
  deliveriesPageEvents,
} from './deliveries.events';

interface DeliveriesState {
  loading: boolean;
  error: string | null;
  query: Partial<GetDeliveries>;
  meta: PaginationMeta | null;
}

const initialState: DeliveriesState = {
  loading: false,
  error: null,
  // Newest deliveries first.
  query: { page: 1, limit: 12, sortBy: 'created_at', sortOrder: 'desc' },
  meta: null,
};

export const DeliveriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<Delivery>(),
  withComputed(({ entities, meta }) => ({
    total: computed(() => meta()?.total ?? entities().length),
  })),
  // State transitions driven purely by events.
  withReducer(
    on(deliveriesPageEvents.opened, deliveriesPageEvents.reloaded, () => ({
      loading: true,
      error: null,
    })),
    on(deliveriesPageEvents.queryChanged, (event, state) => ({
      loading: true,
      error: null,
      query: { ...state.query, ...event.payload },
    })),
    on(deliveriesApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload.data),
      { loading: false, meta: payload.meta },
    ]),
    on(deliveriesApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    // Drop cached deliveries when the user logs out.
    on(authEvents.loggedOut, () => [removeAllEntities(), initialState]),
  ),
  // Side effects: listen for UI events, call the API, dispatch API events.
  withHooks({
    onInit(
      store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(DeliveriesService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      events
        .on(
          deliveriesPageEvents.opened,
          deliveriesPageEvents.reloaded,
          deliveriesPageEvents.queryChanged,
        )
        .pipe(
          switchMap(() =>
            service.list(store.query()).pipe(
              mapResponse({
                next: (res) => deliveriesApiEvents.loadedSuccess(res),
                error: (err: Error) =>
                  deliveriesApiEvents.loadedFailure(
                    err.message || 'Failed to load deliveries',
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
