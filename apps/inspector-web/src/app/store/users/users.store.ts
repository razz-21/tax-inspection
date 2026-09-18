import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { mergeMap, switchMap } from 'rxjs';
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
import type {
  GetUsers,
  PaginationMeta,
  PublicUser,
} from '@tax-inspection/shared';
import { UsersService } from '../../service/users.service';
import { authEvents } from '../auth/auth.events';
import { usersApiEvents, usersPageEvents } from './users.events';

interface UsersState {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  query: Partial<GetUsers>;
  meta: PaginationMeta | null;
}

const initialState: UsersState = {
  loading: false,
  error: null,
  selectedId: null,
  query: { page: 1, limit: 12 },
  meta: null,
};

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<PublicUser>(),
  withComputed(({ entities, selectedId, meta }) => ({
    total: computed(() => meta()?.total ?? entities().length),
    selected: computed(
      () => entities().find((u) => u.id === selectedId()) ?? null,
    ),
  })),
  // State transitions driven purely by events.
  withReducer(
    on(usersPageEvents.opened, usersPageEvents.reloaded, () => ({
      loading: true,
      error: null,
    })),
    on(usersPageEvents.queryChanged, (event, state) => ({
      loading: true,
      error: null,
      query: { ...state.query, ...event.payload },
    })),
    on(usersApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities(payload.data),
      { loading: false, meta: payload.meta },
    ]),
    on(usersApiEvents.loadedFailure, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
    on(usersApiEvents.createdSuccess, ({ payload }) => addEntity(payload)),
    on(usersApiEvents.updatedSuccess, ({ payload }) => upsertEntity(payload)),
    on(usersApiEvents.removedSuccess, ({ payload }) => removeEntity(payload)),
    on(
      usersApiEvents.createdFailure,
      usersApiEvents.updatedFailure,
      usersApiEvents.removedFailure,
      ({ payload }) => ({ error: payload }),
    ),
    on(usersPageEvents.selected, ({ payload }) => ({ selectedId: payload })),
    // Drop cached users when the user logs out.
    on(authEvents.loggedOut, () => [removeAllEntities(), initialState]),
  ),
  // Side effects: listen for UI events, call the API, dispatch API events.
  withHooks({
    onInit(
      store,
      events = inject(Events),
      dispatcher = inject(Dispatcher),
      service = inject(UsersService),
    ) {
      const dispatch = (event: unknown) =>
        dispatcher.dispatch(event as Parameters<typeof dispatcher.dispatch>[0]);

      // Load (initial, reload, query change)
      events
        .on(
          usersPageEvents.opened,
          usersPageEvents.reloaded,
          usersPageEvents.queryChanged,
        )
        .pipe(
          switchMap(() =>
            service.list(store.query()).pipe(
              mapResponse({
                next: (res) => usersApiEvents.loadedSuccess(res),
                error: (err: Error) =>
                  usersApiEvents.loadedFailure(
                    err.message || 'Failed to load users',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Create
      events
        .on(usersPageEvents.created)
        .pipe(
          mergeMap((event) =>
            service.create(event.payload).pipe(
              mapResponse({
                next: (user) => usersApiEvents.createdSuccess(user),
                error: (err: Error) =>
                  usersApiEvents.createdFailure(
                    err.message || 'Failed to create user',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Update
      events
        .on(usersPageEvents.updated)
        .pipe(
          mergeMap((event) =>
            service.update(event.payload.id, event.payload.changes).pipe(
              mapResponse({
                next: (user) => usersApiEvents.updatedSuccess(user),
                error: (err: Error) =>
                  usersApiEvents.updatedFailure(
                    err.message || 'Failed to update user',
                  ),
              }),
            ),
          ),
          takeUntilDestroyed(),
        )
        .subscribe(dispatch);

      // Remove
      events
        .on(usersPageEvents.removed)
        .pipe(
          mergeMap((event) =>
            service.remove(event.payload).pipe(
              mapResponse({
                next: () => usersApiEvents.removedSuccess(event.payload),
                error: (err: Error) =>
                  usersApiEvents.removedFailure(
                    err.message || 'Failed to delete user',
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
