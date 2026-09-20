import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFileStack,
  lucideTruck,
  lucideUserRound,
} from '@ng-icons/lucide';
import { DraftDeliveriesService } from '../../service/draft-deliveries.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field-officer.layout.html',
})
export class FieldOfficerLayout {
  /** Live count of locally-saved drafts, shown as a nav badge. */
  protected readonly draftCount = inject(DraftDeliveriesService).count;

  protected readonly tabs: TabItem[] = [
    { label: 'Deliveries', icon: 'lucideTruck', link: 'deliveries' },
    { label: 'Drafts', icon: 'lucideFileStack', link: 'deliveries/drafts' },
    { label: 'Profile', icon: 'lucideUserRound', link: 'profile' },
  ];
}
