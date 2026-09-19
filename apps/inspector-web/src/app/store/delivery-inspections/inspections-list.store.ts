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
  DeliveryInspection,
  GetDeliveryInspections,
  PaginationMeta,
} from '@tax-inspection/shared';
import { DeliveryInspectionsService } from '../../service/delivery-inspections.service';
import { authEvents } from '../auth/auth.events';
import {
  inspectionsListApiEvents,
  inspectionsListPageEvents,
} from './inspections-list.events';

interface InspectionsListState {
  loading: boolean;
  error: string | null;
  query: Partial<GetDeliveryInspections>;
  meta: PaginationMeta | null;
}

const initialState: InspectionsListState = {
  loading: false,
  error: null,
  // Newest inspections first.
  query: { page: 1, limit: 12, sortBy: 'created_at', sortOrder: 'desc' },
  meta: null,
};

/** Back-office list of every delivery inspection (paginated). */
export const InspectionsListStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<DeliveryInspection>(),
  withComputed(({ entities, meta }) => ({
    total: computed(() => meta()?.total ?? entities().length),
  })),
  // State transitions driven purely by events.
  withReducer(
    on(
      inspectionsListPageEvents.opened,
      inspectionsListPageEvents.reloaded,
      () => ({ loading: true, error: null }),
    ),
    on(inspectionsListPageEvents.queryChanged, (event, state) => ({
      loading: true,
      error: null,
      query: { ...state.query, ...event.payload },
    })),
    on(inspectionsListApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload.data),
      { loading: false, meta: payload.meta },
    ]),
    on(inspectionsListApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    // Drop cached inspections when the user logs out.
    on(authEvents.loggedOut, () => [removeAllEntities(), initialState]),
  ),
  // Side effects: listen for UI events, call the API, dispatch API events.
  withHooks({
    onInit(
      store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(DeliveryInspectionsService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      events
        .on(
          inspectionsListPageEvents.opened,
          inspectionsListPageEvents.reloaded,
          inspectionsListPageEvents.queryChanged,
        )
        .pipe(
          switchMap(() =>
            service.list(store.query()).pipe(
              mapResponse({
                next: (res) => inspectionsListApiEvents.loadedSuccess(res),
                error: (err: Error) =>
                  inspectionsListApiEvents.loadedFailure(
                    err.message || 'Failed to load inspections',
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
