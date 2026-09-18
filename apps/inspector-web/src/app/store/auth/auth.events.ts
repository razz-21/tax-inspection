import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

/**
 * App-wide auth lifecycle events. Feature stores listen for `loggedOut` to
 * clear any cached data so a different user can't see the previous session's
 * entities.
 */
export const authEvents = eventGroup({
  source: 'Auth',
  events: {
    loggedOut: type<void>(),
  },
});
