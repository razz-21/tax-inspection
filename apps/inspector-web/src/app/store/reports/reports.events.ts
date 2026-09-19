import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { GetReport, GetReportResponse } from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const reportsPageEvents = eventGroup({
  source: 'Reports Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    filterChanged: type<GetReport>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const reportsApiEvents = eventGroup({
  source: 'Reports API',
  events: {
    loadedSuccess: type<GetReportResponse>(),
    loadedFailure: type<string>(),
  },
});
