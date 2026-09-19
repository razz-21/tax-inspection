import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { PublicUser } from '@tax-inspection/shared';

/**
 * App-wide auth lifecycle events. Feature stores listen for `loggedIn` to
 * prefetch data the user will need, and for `loggedOut` to clear any cached
 * data so a different user can't see the previous session's entities.
 */
export const authEvents = eventGroup({
  source: 'Auth',
  events: {
    /** Fired after a successful sign-in, carrying the authenticated user. */
    loggedIn: type<PublicUser>(),
    loggedOut: type<void>(),
  },
});
