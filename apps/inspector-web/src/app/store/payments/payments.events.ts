import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { GetPayments, GetPaymentsResponse } from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const paymentsPageEvents = eventGroup({
  source: 'Payments Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    queryChanged: type<Partial<GetPayments>>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const paymentsApiEvents = eventGroup({
  source: 'Payments API',
  events: {
    loadedSuccess: type<GetPaymentsResponse>(),
    loadedFailure: type<string>(),
  },
});
