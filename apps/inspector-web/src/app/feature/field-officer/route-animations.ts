import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
  type AnimationMetadata,
} from '@angular/animations';

const OPTIONAL = { optional: true };

/**
 * Slide the entering page in from `enterFrom` while the leaving page drifts to
 * `leaveTo` and fades. Both pages are absolutely filled (see `.fo-route-viewport`
 * in styles.scss) so they overlap during the transition.
 */
function slide(enterFrom: string, leaveTo: string): AnimationMetadata[] {
  return [
    query(
      ':enter',
      [style({ transform: `translateX(${enterFrom})`, opacity: 0.6 })],
      OPTIONAL,
    ),
    group([
      query(
        ':leave',
        [animate('280ms ease', style({ transform: `translateX(${leaveTo})`, opacity: 0 }))],
        OPTIONAL,
      ),
      query(
        ':enter',
        [animate('280ms ease', style({ transform: 'translateX(0)', opacity: 1 }))],
        OPTIONAL,
      ),
    ]),
  ];
}

/**
 * Depth-based page slide for the field-officer shell. Each route carries a
 * numeric `data.animation` depth. Navigating between same-depth pages (the
 * bottom-nav tabs) doesn't match either transition, so it's instant; going
 * deeper slides in from the right; going back slides in from the left.
 */
export const routeSlideAnimation = trigger('routeAnimations', [
  transition(':increment', slide('100%', '-25%')),
  transition(':decrement', slide('-100%', '25%')),
]);
