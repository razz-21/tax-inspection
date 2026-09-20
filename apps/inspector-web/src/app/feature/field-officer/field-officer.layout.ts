import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFileStack,
  lucideTruck,
  lucideUserRound,
} from '@ng-icons/lucide';
import { DraftDeliveriesService } from '../../service/draft-deliveries.service';
import { routeSlideAnimation } from './route-animations';

interface TabItem {
  label: string;
  icon: string;
  link: string;
}

/**
 * Mobile shell for field officers: a scrollable content area with a fixed
 * bottom navigation. Constrained to a phone-width column on any screen.
 */
@Component({
  selector: 'app-field-officer-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIcon],
  providers: [
    provideIcons({ lucideTruck, lucideFileStack, lucideUserRound }),
  ],
  animations: [routeSlideAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field-officer.layout.html',
})
export class FieldOfficerLayout {
  /** Live count of locally-saved drafts, shown as a nav badge. */
  protected readonly draftCount = inject(DraftDeliveriesService).count;

  /** Respect the OS "reduce motion" setting — skip the page slide when set. */
  protected readonly reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  /**
   * Depth of the active route (from its `data.animation`). Same depth = peer
   * tabs (no slide); a higher depth slides forward, a lower depth slides back.
   */
  protected prepareRoute(outlet: RouterOutlet): number {
    return outlet?.isActivated
      ? (outlet.activatedRouteData?.['animation'] ?? 0)
      : 0;
  }

  protected readonly tabs: TabItem[] = [
    { label: 'Deliveries', icon: 'lucideTruck', link: 'deliveries' },
    { label: 'Drafts', icon: 'lucideFileStack', link: 'deliveries/drafts' },
    { label: 'Profile', icon: 'lucideUserRound', link: 'profile' },
  ];
}
