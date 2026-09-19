import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import {
  removeAllEntities,
  removeEntity,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type { Inspection } from '@tax-inspection/shared';
import { InspectionsService } from '../../service/inspections.service';
import { authEvents } from '../auth/auth.events';
import {
  inspectionsApiEvents,
  inspectionsPageEvents,
} from './inspections.events';

interface InspectionsState {
  loading: boolean;
  /** True once the list has been fetched at least once (cache guard). */
  loaded: boolean;
  error: string | null;
  selectedId: string | null;
}

const initialState: InspectionsState = {
  loading: false,
  loaded: false,
  error: null,
  selectedId: null,
};

export const InspectionsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<Inspection>(),
  withComputed(({ entities, selectedId }) => ({
    total: computed(() => entities().length),
    flaggedCount: computed(
      () => entities().filter((i) => i.status === 'flagged').length,
    ),
    totalAmountDue: computed(() =>
      entities().reduce((sum, i) => sum + i.amountDue, 0),
    ),
    selected: computed(
      () => entities().find((i) => i.id === selectedId()) ?? null,
    ),
  })),
  // State transitions driven purely by events.
  withReducer(
    // Initial open only shows the loading state when nothing is cached yet.
    on(inspectionsPageEvents.opened, (_event, state) =>
      state.loaded ? {} : { loading: true, error: null },
    ),
    on(inspectionsPageEvents.reloaded, () => ({ loading: true, error: null })),
    on(inspectionsApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload),
      { loading: false, loaded: true },
    ]),
    on(inspectionsApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    on(inspectionsPageEvents.selected, ({ payload }) => ({
      selectedId: payload,
    })),
    on(inspectionsPageEvents.removed, ({ payload }) => removeEntity(payload)),
    // Drop cached inspections when the user logs out.
    on(authEvents.loggedOut, () => [removeAllEntities(), initialState]),
  ),
  // Side effects: listen for UI events, call the API, dispatch API events.
  withHooks({
    onInit(
      store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(InspectionsService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      const loadList = () =>
        service.getAll().pipe(
          mapResponse({
            next: (items) => inspectionsApiEvents.loadedSuccess(items),
            error: (err: Error) =>
              inspectionsApiEvents.loadedFailure(
                err.message || 'Failed to load inspections',
              ),
          }),
        );

      // Initial load — skip the API call when the list is already cached.
      events
        .on(inspectionsPageEvents.opened)
        .pipe(
          filter(() => !store.loaded()),
          switchMap(loadList),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Explicit reload — always refetch.
      events
        .on(inspectionsPageEvents.reloaded)
        .pipe(switchMap(loadList), takeUntilDestroyed())
        .subscribe(dispatch);
    },
  }),
);
