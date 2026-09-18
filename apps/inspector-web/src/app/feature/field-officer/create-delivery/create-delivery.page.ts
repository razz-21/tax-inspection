import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';

/** Create-delivery form (mobile). Blank scaffold for now. */
@Component({
  selector: 'app-create-delivery-page',
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4"
    >
      <a
        routerLink="/field-officer/deliveries"
        class="-ml-1 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        aria-label="Back"
      >
        <ng-icon name="lucideArrowLeft" size="1.25rem" />
      </a>
      <h1 class="text-lg font-semibold">Create Delivery</h1>
    </header>
  `,
})
export class CreateDeliveryPage {}
