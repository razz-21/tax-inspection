import { Route } from '@angular/router';
import { authGuard } from './guard/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./feature/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./feature/main/main.layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./feature/dashboard/dashboard.page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: 'inspections',
        loadComponent: () =>
          import('./feature/inspections/inspections.page').then(
            (m) => m.InspectionsPage,
          ),
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import('./feature/user-management/user-management.page').then(
            (m) => m.UserManagementPage,
          ),
      },
    ],
  },
];
