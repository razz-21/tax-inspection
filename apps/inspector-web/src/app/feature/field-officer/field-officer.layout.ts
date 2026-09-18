import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTruck, lucideUserRound } from '@ng-icons/lucide';

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
  providers: [provideIcons({ lucideTruck, lucideUserRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field-officer.layout.html',
})
export class FieldOfficerLayout {
  protected readonly tabs: TabItem[] = [
    { label: 'Deliveries', icon: 'lucideTruck', link: 'deliveries' },
    { label: 'Profile', icon: 'lucideUserRound', link: 'profile' },
  ];
}
