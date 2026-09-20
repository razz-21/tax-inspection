import { Route } from '@angular/router';
import { authGuard } from './guard/auth.guard';
import { backOfficeGuard, fieldOfficerGuard } from './guard/role.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./feature/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'field-officer',
    canActivate: [authGuard, fieldOfficerGuard],
    loadComponent: () =>
      import('./feature/field-officer/field-officer.layout').then(
        (m) => m.FieldOfficerLayout,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'deliveries',
      },
      {
        path: 'deliveries',
        loadComponent: () =>
          import('./feature/field-officer/deliveries/deliveries.page').then(
            (m) => m.DeliveriesPage,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./feature/field-officer/profile/profile.page').then(
            (m) => m.ProfilePage,
          ),
      },
      {
        path: 'profile/edit',
        loadComponent: () =>
          import(
            './feature/field-officer/edit-profile/edit-profile.page'
          ).then((m) => m.EditProfilePage),
      },
      {
        path: 'profile/change-password',
        loadComponent: () =>
          import(
            './feature/field-officer/change-password/change-password.page'
          ).then((m) => m.ChangePasswordPage),
      },
      {
        path: 'deliveries/create',
        loadComponent: () =>
          import(
            './feature/field-officer/create-delivery/create-delivery.page'
          ).then((m) => m.CreateDeliveryPage),
      },
      {
        path: 'deliveries/drafts',
        loadComponent: () =>
          import(
            './feature/field-officer/draft-devlieries/draft-devlieries.page'
          ).then((m) => m.DraftDeliveriesPage),
      },
      {
        path: 'deliveries/:id',
        loadComponent: () =>
          import(
            './feature/field-officer/delivery-detail/delivery-detail.page'
          ).then((m) => m.DeliveryDetailPage),
      },
      {
        path: 'deliveries/:id/add-inspection',
        loadComponent: () =>
          import(
            './feature/field-officer/add-inspection/add-inspection.page'
          ).then((m) => m.AddInspectionPage),
      },
    ],
  },
  {
    path: 'main',
    canActivate: [authGuard, backOfficeGuard],
    loadComponent: () =>
      import('./feature/main/main.layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
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
        path: 'deliveries',
        loadComponent: () =>
          import('./feature/deliveries/deliveries.page').then(
            (m) => m.DeliveriesPage,
          ),
      },
      {
        path: 'deliveries/:id',
        loadComponent: () =>
          import('./feature/delivery-details/delivery-details.page').then(
            (m) => m.DeliveryDetailsPage,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./feature/payments/payments.page').then(
            (m) => m.PaymentsPage,
          ),
      },
      {
        path: 'source-of-materials',
        loadComponent: () =>
          import(
            './feature/source-of-materials/source-of-materials.page'
          ).then((m) => m.SourceOfMaterialsPage),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./feature/reports/report.page').then((m) => m.ReportsPage),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./feature/analytics/analytics.page').then(
            (m) => m.AnalyticsPage,
          ),
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import('./feature/user-management/user-management.page').then(
            (m) => m.UserManagementPage,
          ),
      },
      {
        path: 'profile-settings',
        loadComponent: () =>
          import('./feature/profile-settings/profile-settings.page').then(
            (m) => m.ProfileSettingsPage,
          ),
      },
    ],
  },
];
