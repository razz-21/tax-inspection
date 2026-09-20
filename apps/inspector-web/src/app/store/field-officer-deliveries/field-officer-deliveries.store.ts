import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import {
  addEntity,
  removeAllEntities,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type { Delivery, GetDeliveries } from '@tax-inspection/shared';
import { DeliveriesService } from '../../service/deliveries.service';
import { compareDeliveriesByDateTimeDesc } from '../../util/delivery-order';
import { authEvents } from '../auth/auth.events';
import {
  fieldOfficerDeliveriesApiEvents,
  fieldOfficerDeliveriesPageEvents,
} from './field-officer-deliveries.events';

interface FieldOfficerDeliveriesState {
  loading: boolean;
  /** True once the list has been fetched at least once (cache guard). */
  loaded: boolean;
  error: string | null;
}

const initialState: FieldOfficerDeliveriesState = {
  loading: false,
  loaded: false,
  error: null,
};

/** The field officer's own delivery list — newest first by date, capped at 50. */
const LIST_QUERY: Partial<GetDeliveries> = {
  limit: 50,
  sortBy: 'date',
  sortOrder: 'desc',
};

/**
 * Caches the field officer's delivery list so revisiting the screen serves the
 * cache instead of refetching. Being `providedIn: 'root'`, the store outlives
 * the page component, so navigating away and back keeps the loaded data. An
 * explicit reload (retry) always refetches, and a freshly created delivery is
 * prepended optimistically. The cache resets on logout.
 */
export const FieldOfficerDeliveriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<Delivery>(),
  withComputed(({ entities }) => ({
    /** Newest-first by reported date then time, independent of insertion order. */
    sorted: computed(() =>
      [...entities()].sort(compareDeliveriesByDateTimeDesc),
    ),
  })),
  // State transitions driven purely by events.
  withReducer(
    // Initial open only shows the loading state when nothing is cached yet.
    on(fieldOfficerDeliveriesPageEvents.opened, (_event, state) =>
      state.loaded ? {} : { loading: true, error: null },
    ),
    on(fieldOfficerDeliveriesPageEvents.reloaded, () => ({
      loading: true,
      error: null,
    })),
    // Optimistically show a newly created delivery without a refetch.
    on(fieldOfficerDeliveriesPageEvents.created, ({ payload }) =>
      addEntity(payload),
    ),
    on(fieldOfficerDeliveriesApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload.data),
      { loading: false, loaded: true },
    ]),
    on(fieldOfficerDeliveriesApiEvents.loadedFailure, ({ payload }) => ({
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

      const loadList = () =>
        service.list(LIST_QUERY).pipe(
          mapResponse({
            next: (res) => fieldOfficerDeliveriesApiEvents.loadedSuccess(res),
            error: (err: Error) =>
              fieldOfficerDeliveriesApiEvents.loadedFailure(
                err.message || 'Failed to load deliveries',
              ),
          }),
        );

      // Initial load — skip the API call when the list is already cached.
      events
        .on(fieldOfficerDeliveriesPageEvents.opened)
        .pipe(
          filter(() => !store.loaded()),
          switchMap(loadList),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Explicit reload — always refetch.
      events
        .on(fieldOfficerDeliveriesPageEvents.reloaded)
        .pipe(switchMap(loadList), takeUntilDestroyed())
        .subscribe(dispatch);
    },
  }),
);
