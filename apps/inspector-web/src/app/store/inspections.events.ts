import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { Inspection } from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const inspectionsPageEvents = eventGroup({
  source: 'Inspections Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    selected: type<string | null>(),
    removed: type<string>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const inspectionsApiEvents = eventGroup({
  source: 'Inspections API',
  events: {
    loadedSuccess: type<Inspection[]>(),
    loadedFailure: type<string>(),
  },
});
