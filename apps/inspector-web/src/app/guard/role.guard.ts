import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import type { UserRole } from '@tax-inspection/shared';
import { MeStore } from '../store/me/me.store';

/** Where a user lands after login, based on their role. */
export const homeUrlForRole = (role: UserRole | null): string =>
  role === 'field_officer' ? '/field-officer' : '/main';

/** Restrict the mobile field-officer area to `field_officer` users. */
export const fieldOfficerGuard: CanActivateFn = () => {
  const role = inject(MeStore).role();
  const router = inject(Router);
  return role === 'field_officer' ? true : router.createUrlTree(['/main']);
};

/** Keep field officers out of the desktop back-office shell. */
export const backOfficeGuard: CanActivateFn = () => {
  const role = inject(MeStore).role();
  const router = inject(Router);
  return role === 'field_officer'
    ? router.createUrlTree(['/field-officer'])
    : true;
};
