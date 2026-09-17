import { Route } from '@angular/router';
import { authGuard } from './guard/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./feature/inspections/inspections.page').then(
        (m) => m.InspectionsPage,
      ),
  },
];
