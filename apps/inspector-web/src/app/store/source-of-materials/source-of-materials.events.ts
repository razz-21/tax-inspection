import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type {
  GetSourceOfMaterialsResponse,
  PatchSourceOfMaterial,
  PostSourceOfMaterial,
  SourceOfMaterial,
} from '@tax-inspection/shared';

/** Events dispatched by the UI (page/components). */
export const sourceOfMaterialsPageEvents = eventGroup({
  source: 'Source Of Materials Page',
  events: {
    opened: type<void>(),
    reloaded: type<void>(),
    created: type<PostSourceOfMaterial>(),
    updated: type<{ id: string; changes: PatchSourceOfMaterial }>(),
    removed: type<string>(),
  },
});

/** Events dispatched by the API/effects layer. */
export const sourceOfMaterialsApiEvents = eventGroup({
  source: 'Source Of Materials API',
  events: {
    loadedSuccess: type<GetSourceOfMaterialsResponse>(),
    loadedFailure: type<string>(),
    createdSuccess: type<SourceOfMaterial>(),
    createdFailure: type<string>(),
    updatedSuccess: type<SourceOfMaterial>(),
    updatedFailure: type<string>(),
    removedSuccess: type<string>(),
    removedFailure: type<string>(),
  },
});
