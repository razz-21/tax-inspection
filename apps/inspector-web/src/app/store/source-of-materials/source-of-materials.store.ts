import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, mergeMap, switchMap } from 'rxjs';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import {
  addEntity,
  removeAllEntities,
  removeEntity,
  setAllEntities,
  upsertEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type { SourceOfMaterial } from '@tax-inspection/shared';
import { SourceOfMaterialsService } from '../../service/source-of-materials.service';
import { authEvents } from '../auth/auth.events';
import {
  sourceOfMaterialsApiEvents,
  sourceOfMaterialsPageEvents,
} from './source-of-materials.events';

interface SourceOfMaterialsState {
  /** List load in flight. */
  loading: boolean;
  /** True once the list has been fetched at least once (cache guard). */
  loaded: boolean;
  /** Create or update in flight. */
  saving: boolean;
  /** Delete in flight. */
  deleting: boolean;
  error: string | null;
}

const initialState: SourceOfMaterialsState = {
  loading: false,
  loaded: false,
  saving: false,
  deleting: false,
  error: null,
};

export const SourceOfMaterialsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<SourceOfMaterial>(),
  withComputed(({ entities }) => ({
    total: computed(() => entities().length),
    /** Records ordered by name for display. */
    sorted: computed(() =>
      [...entities()].sort((a, b) => a.name.localeCompare(b.name)),
    ),
  })),
  // State transitions driven purely by events.
  withReducer(
    // Initial open only shows the loading state when nothing is cached yet.
    on(sourceOfMaterialsPageEvents.opened, (_event, state) =>
      state.loaded ? {} : { loading: true, error: null },
    ),
    on(sourceOfMaterialsPageEvents.reloaded, () => ({
      loading: true,
      error: null,
    })),
    on(sourceOfMaterialsApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload),
      { loading: false, loaded: true },
    ]),
    on(sourceOfMaterialsApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),

    // Create / update share the `saving` flag.
    on(
      sourceOfMaterialsPageEvents.created,
      sourceOfMaterialsPageEvents.updated,
      () => ({ saving: true, error: null }),
    ),
    on(sourceOfMaterialsApiEvents.createdSuccess, ({ payload }) => [
      addEntity(payload),
      { saving: false },
    ]),
    on(sourceOfMaterialsApiEvents.updatedSuccess, ({ payload }) => [
      upsertEntity(payload),
      { saving: false },
    ]),
    on(
      sourceOfMaterialsApiEvents.createdFailure,
      sourceOfMaterialsApiEvents.updatedFailure,
      ({ payload }) => ({ saving: false, error: payload }),
    ),

    // Delete.
    on(sourceOfMaterialsPageEvents.removed, () => ({
      deleting: true,
      error: null,
    })),
    on(sourceOfMaterialsApiEvents.removedSuccess, ({ payload }) => [
      removeEntity(payload),
      { deleting: false },
    ]),
    on(sourceOfMaterialsApiEvents.removedFailure, ({ payload }) => ({
      deleting: false,
      error: payload,
    })),

    // Drop cached records when the user logs out.
    on(authEvents.loggedOut, () => [removeAllEntities(), initialState]),
  ),
  // Side effects: listen for UI events, call the API, dispatch API events.
  withHooks({
    onInit(
      store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(SourceOfMaterialsService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      const loadList = () =>
        service.list().pipe(
          mapResponse({
            next: (res) => sourceOfMaterialsApiEvents.loadedSuccess(res),
            error: (err: Error) =>
              sourceOfMaterialsApiEvents.loadedFailure(
                err.message || 'Failed to load source of materials',
              ),
          }),
        );

      // Initial load — skip the API call when the list is already cached.
      events
        .on(sourceOfMaterialsPageEvents.opened)
        .pipe(
          filter(() => !store.loaded()),
          switchMap(loadList),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Explicit reload — always refetch.
      events
        .on(sourceOfMaterialsPageEvents.reloaded)
        .pipe(switchMap(loadList), takeUntilDestroyed())
        .subscribe(dispatch);

      // Create
      events
        .on(sourceOfMaterialsPageEvents.created)
        .pipe(
          mergeMap((event) =>
            service.create(event.payload).pipe(
              mapResponse({
                next: (record) =>
                  sourceOfMaterialsApiEvents.createdSuccess(record),
                error: (err: Error) =>
                  sourceOfMaterialsApiEvents.createdFailure(
                    err.message || 'Failed to create source of materials',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Update
      events
        .on(sourceOfMaterialsPageEvents.updated)
        .pipe(
          mergeMap((event) =>
            service.update(event.payload.id, event.payload.changes).pipe(
              mapResponse({
                next: (record) =>
                  sourceOfMaterialsApiEvents.updatedSuccess(record),
                error: (err: Error) =>
                  sourceOfMaterialsApiEvents.updatedFailure(
                    err.message || 'Failed to update source of materials',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Remove
      events
        .on(sourceOfMaterialsPageEvents.removed)
        .pipe(
          mergeMap((event) =>
            service.remove(event.payload).pipe(
              mapResponse({
                next: () =>
                  sourceOfMaterialsApiEvents.removedSuccess(event.payload),
                error: (err: Error) =>
                  sourceOfMaterialsApiEvents.removedFailure(
                    err.message || 'Failed to delete source of materials',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Prefetch on field-officer login — they'll need the material sources
      // later (e.g. when creating a delivery), so warm the cache ahead of time.
      events
        .on(authEvents.loggedIn)
        .pipe(
          filter(
            (event) =>
              event.payload.role === 'field_officer' && !store.loaded(),
          ),
          switchMap(loadList),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);
    },
  }),
);
