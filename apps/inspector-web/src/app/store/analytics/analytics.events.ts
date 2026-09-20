import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { AnalyticsRange, AnalyticsSummary } from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const analyticsPageEvents = eventGroup({
  source: 'Analytics Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    rangeChanged: type<AnalyticsRange>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const analyticsApiEvents = eventGroup({
  source: 'Analytics API',
  events: {
    loadedSuccess: type<AnalyticsSummary>(),
    loadedFailure: type<string>(),
  },
});
