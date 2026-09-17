import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import {
  removeEntity,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { Dispatcher, Events, on, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import type { Inspection } from '@tax-inspection/shared';
import { InspectionsService } from '../service/inspections.service';
import {
  inspectionsApiEvents,
  inspectionsPageEvents,
} from './inspections.events';

interface InspectionsState {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

const initialState: InspectionsState = {
  loading: false,
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
    on(inspectionsPageEvents.opened, inspectionsPageEvents.reloaded, () => ({
      loading: true,
      error: null,
    })),
    on(inspectionsApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload),
      { loading: false },
    ]),
    on(inspectionsApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    on(inspectionsPageEvents.selected, ({ payload }) => ({
      selectedId: payload,
    })),
    on(inspectionsPageEvents.removed, ({ payload }) => removeEntity(payload)),
  ),
  // Side effects: listen for UI events, call the API, dispatch API events.
  withHooks({
    onInit(
      _store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(InspectionsService),
    ) {
      events
        .on(inspectionsPageEvents.opened, inspectionsPageEvents.reloaded)
        .pipe(
          switchMap(() =>
            service.getAll().pipe(
              mapResponse({
                next: (items) => inspectionsApiEvents.loadedSuccess(items),
                error: (err: Error) =>
                  inspectionsApiEvents.loadedFailure(
                    err.message || 'Failed to load inspections',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe((event) => dispatcher.dispatch(event));
    },
  }),
);
