import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type {
  GetDeliveries,
  GetDeliveriesResponse,
} from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const deliveriesPageEvents = eventGroup({
  source: 'Deliveries Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    queryChanged: type<Partial<GetDeliveries>>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const deliveriesApiEvents = eventGroup({
  source: 'Deliveries API',
  events: {
    loadedSuccess: type<GetDeliveriesResponse>(),
    loadedFailure: type<string>(),
  },
});
