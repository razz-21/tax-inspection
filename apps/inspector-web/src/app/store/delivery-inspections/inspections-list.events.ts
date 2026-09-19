import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type {
  GetDeliveryInspections,
  GetDeliveryInspectionsResponse,
} from '@tax-inspection/shared';

/** Events dispatched by the back-office inspections list page. */
export const inspectionsListPageEvents = eventGroup({
  source: 'Inspections List Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    queryChanged: type<Partial<GetDeliveryInspections>>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const inspectionsListApiEvents = eventGroup({
  source: 'Inspections List API',
  events: {
    loadedSuccess: type<GetDeliveryInspectionsResponse>(),
    loadedFailure: type<string>(),
  },
});
