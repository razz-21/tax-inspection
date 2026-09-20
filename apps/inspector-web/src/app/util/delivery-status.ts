import {
  lucideCircleCheck,
  lucideCircleX,
  lucideClock,
} from '@ng-icons/lucide';
import {
  DELIVERY_STATUSES,
  type DeliveryStatus,
} from '@tax-inspection/shared';

export interface DeliveryStatusMeta {
  label: DeliveryStatus;
  /** ng-icon name (registered via the maps below). */
  icon: string;
  /** Badge classes for the status chip. */
  badge: string;
}

/** Presentation for each delivery status — icon + colored badge. */
export const DELIVERY_STATUS_META: Record<DeliveryStatus, DeliveryStatusMeta> = {
  'In Review': {
    label: 'In Review',
    icon: 'lucideClock',
    badge:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  Completed: {
    label: 'Completed',
    icon: 'lucideCircleCheck',
    badge:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  },
  Closed: {
    label: 'Closed',
    icon: 'lucideCircleX',
    badge:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

/** Ordered list for rendering the status menu. */
export const DELIVERY_STATUS_OPTIONS: DeliveryStatusMeta[] =
  DELIVERY_STATUSES.map((status) => DELIVERY_STATUS_META[status]);

/** Icons used by status chips/menus — pass to `provideIcons`. */
export const DELIVERY_STATUS_ICONS = {
  lucideClock,
  lucideCircleCheck,
  lucideCircleX,
};
