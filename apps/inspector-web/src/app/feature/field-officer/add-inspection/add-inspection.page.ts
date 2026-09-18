import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';

/** Add-inspection form for a delivery (mobile). Blank scaffold for now. */
@Component({
  selector: 'app-add-inspection-page',
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4"
    >
      <a
        [routerLink]="['/field-officer/deliveries', deliveryId]"
        class="-ml-1 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        aria-label="Back"
      >
        <ng-icon name="lucideArrowLeft" size="1.25rem" />
      </a>
      <h1 class="text-lg font-semibold">Add Inspection</h1>
    </header>
  `,
})
export class AddInspectionPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly deliveryId = this.route.snapshot.paramMap.get('id');
}
