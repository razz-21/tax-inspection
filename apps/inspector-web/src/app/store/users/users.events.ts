import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type {
  GetUsers,
  GetUsersResponse,
  PatchUser,
  PostUser,
  PublicUser,
} from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const usersPageEvents = eventGroup({
  source: 'Users Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    queryChanged: type<Partial<GetUsers>>(),
    selected: type<string | null>(),
    created: type<PostUser>(),
    updated: type<{ id: string; changes: PatchUser }>(),
    removed: type<string>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const usersApiEvents = eventGroup({
  source: 'Users API',
  events: {
    loadedSuccess: type<GetUsersResponse>(),
    loadedFailure: type<string>(),
    createdSuccess: type<PublicUser>(),
    createdFailure: type<string>(),
    updatedSuccess: type<PublicUser>(),
    updatedFailure: type<string>(),
    removedSuccess: type<string>(),
    removedFailure: type<string>(),
  },
});
