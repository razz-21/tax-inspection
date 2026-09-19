import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { DashboardRange, DashboardSummary } from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const dashboardPageEvents = eventGroup({
  source: 'Dashboard Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    rangeChanged: type<DashboardRange>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const dashboardApiEvents = eventGroup({
  source: 'Dashboard API',
  events: {
    loadedSuccess: type<DashboardSummary>(),
    loadedFailure: type<string>(),
  },
});
