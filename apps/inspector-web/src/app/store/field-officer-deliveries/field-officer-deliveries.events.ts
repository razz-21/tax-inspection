import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { Delivery, GetDeliveriesResponse } from '@tax-inspection/shared';

/** Events dispatched by the UI (field officer pages). */
export const fieldOfficerDeliveriesPageEvents = eventGroup({
  source: 'Field Officer Deliveries Page',
  events: {
    /** List screen opened — loads once, then serves the cache. */
    opened: type<void>(),
    /** User pulled to refresh / tapped retry — always refetches. */
    reloaded: type<void>(),
    /** A delivery was just created — prepend it to the cached list. */
    created: type<Delivery>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const fieldOfficerDeliveriesApiEvents = eventGroup({
  source: 'Field Officer Deliveries API',
  events: {
    loadedSuccess: type<GetDeliveriesResponse>(),
    loadedFailure: type<string>(),
  },
});
