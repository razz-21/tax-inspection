import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type {
  DeliveryInspection,
  GetDeliveryInspectionsResponse,
  PostDeliveryInspection,
} from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const deliveryInspectionsPageEvents = eventGroup({
  source: 'Delivery Inspections Page',
  events: {
    /** Load the inspections for a delivery (payload = delivery id). */
    opened: type<string>(),
    reloaded: type<string>(),
    created: type<PostDeliveryInspection>(),
    /** Remove an inspection (payload = inspection id). */
    removed: type<string>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const deliveryInspectionsApiEvents = eventGroup({
  source: 'Delivery Inspections API',
  events: {
    loadedSuccess: type<GetDeliveryInspectionsResponse>(),
    loadedFailure: type<string>(),
    createdSuccess: type<DeliveryInspection>(),
    createdFailure: type<string>(),
    removedSuccess: type<string>(),
    removedFailure: type<string>(),
  },
});
