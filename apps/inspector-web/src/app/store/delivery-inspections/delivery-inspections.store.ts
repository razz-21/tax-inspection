import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { mergeMap, switchMap } from 'rxjs';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import {
  addEntity,
  removeAllEntities,
  removeEntity,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type { DeliveryInspection } from '@tax-inspection/shared';
import { DeliveryInspectionsService } from '../../service/delivery-inspections.service';
import { authEvents } from '../auth/auth.events';
import {
  deliveryInspectionsApiEvents,
  deliveryInspectionsPageEvents,
} from './delivery-inspections.events';

interface DeliveryInspectionsState {
  loading: boolean;
  error: string | null;
  /** The delivery whose inspections are currently loaded. */
  deliveryId: string | null;
}

const initialState: DeliveryInspectionsState = {
  loading: false,
  error: null,
  deliveryId: null,
};

export const DeliveryInspectionsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<DeliveryInspection>(),
  withComputed(({ entities }) => ({
    total: computed(() => entities().length),
  })),
  // State transitions driven purely by events.
  withReducer(
    on(
      deliveryInspectionsPageEvents.opened,
      deliveryInspectionsPageEvents.reloaded,
      ({ payload }) => ({ loading: true, error: null, deliveryId: payload }),
    ),
    on(deliveryInspectionsApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload.data),
      { loading: false },
    ]),
    on(deliveryInspectionsApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    on(deliveryInspectionsApiEvents.createdSuccess, ({ payload }) =>
      addEntity(payload),
    ),
    on(deliveryInspectionsApiEvents.removedSuccess, ({ payload }) =>
      removeEntity(payload),
    ),
    on(
      deliveryInspectionsApiEvents.createdFailure,
      deliveryInspectionsApiEvents.removedFailure,
      ({ payload }) => ({ error: payload }),
    ),
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

      // Load (initial + reload) — newest inspections first.
      events
        .on(
          deliveryInspectionsPageEvents.opened,
          deliveryInspectionsPageEvents.reloaded,
        )
        .pipe(
          switchMap(({ payload }) =>
            service
              .list({
                delivery_id: payload,
                sortBy: 'created_at',
                sortOrder: 'desc',
              })
              .pipe(
                mapResponse({
                  next: (res) =>
                    deliveryInspectionsApiEvents.loadedSuccess(res),
                  error: (err: Error) =>
                    deliveryInspectionsApiEvents.loadedFailure(
                      err.message || 'Failed to load inspections',
                    ),
                }),
              ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Create
      events
        .on(deliveryInspectionsPageEvents.created)
        .pipe(
          mergeMap((event) =>
            service.create(event.payload).pipe(
              mapResponse({
                next: (inspection) =>
                  deliveryInspectionsApiEvents.createdSuccess(inspection),
                error: (err: Error) =>
                  deliveryInspectionsApiEvents.createdFailure(
                    err.message || 'Failed to save inspection',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Remove
      events
        .on(deliveryInspectionsPageEvents.removed)
        .pipe(
          mergeMap((event) =>
            service.remove(event.payload).pipe(
              mapResponse({
                next: () =>
                  deliveryInspectionsApiEvents.removedSuccess(event.payload),
                error: (err: Error) =>
                  deliveryInspectionsApiEvents.removedFailure(
                    err.message || 'Failed to delete inspection',
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
