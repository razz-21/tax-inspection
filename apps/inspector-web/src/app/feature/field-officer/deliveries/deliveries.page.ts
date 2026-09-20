import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideMapPin,
  lucidePackage,
  lucidePlus,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { Dispatcher } from '@ngrx/signals/events';
import { FieldOfficerDeliveriesStore } from '../../../store/field-officer-deliveries/field-officer-deliveries.store';
import { fieldOfficerDeliveriesPageEvents } from '../../../store/field-officer-deliveries/field-officer-deliveries.events';

/** Field officer's delivery list (mobile). */
@Component({
  selector: 'app-deliveries-page',
  imports: [
    RouterLink,
    NgIcon,
    HlmButtonImports,
    HlmSkeletonImports,
  ],
  providers: [
    provideIcons({
      lucidePackage,
      lucideMapPin,
      lucidePlus,
      lucideChevronRight,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4"
    >
      <h1 class="text-lg font-semibold">Deliveries</h1>
    </header>

    @if (loading()) {
      <ul class="divide-y">
        @for (row of [1, 2, 3, 4]; track row) {
          <li class="flex items-center gap-3 px-4 py-3">
            <div hlmSkeleton class="size-10 shrink-0 rounded-full"></div>
            <div class="flex-1 space-y-2">
              <div hlmSkeleton class="h-4 w-1/2"></div>
              <div hlmSkeleton class="h-3 w-3/4"></div>
            </div>
          </li>
        }
      </ul>
    } @else if (error()) {
      <div class="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <p class="text-sm text-muted-foreground">{{ error() }}</p>
        <button hlmBtn variant="outline" [loading]="loading()" (click)="load()">Retry</button>
      </div>
    } @else {
      <ul class="divide-y">
        @for (delivery of deliveries(); track delivery.id) {
          <li>
            <a
              [routerLink]="['/field-officer/deliveries', delivery.id]"
              class="flex items-center gap-3 px-4 py-3 transition hover:bg-accent"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <ng-icon name="lucidePackage" size="1.25rem" />
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate font-medium">{{ delivery.haulers.name }}</p>
                  <span
                    class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                  >
                    {{ delivery.materials.material_type }}
                  </span>
                </div>
                <p
                  class="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground"
                >
                  <ng-icon name="lucideMapPin" size="0.875rem" />
                  {{ delivery.place_of_deliveries }}
                </p>
                <p class="mt-0.5 truncate text-xs text-muted-foreground">
                  {{ delivery.date }} · {{ delivery.time }} · Qty
                  {{ delivery.quantity }}
                </p>
              </div>

              <ng-icon
                name="lucideChevronRight"
                size="1.125rem"
                class="shrink-0 text-muted-foreground"
              />
            </a>
          </li>
        } @empty {
          <li class="px-4 py-12 text-center text-sm text-muted-foreground">
            No deliveries yet. Tap + to create one.
          </li>
        }
      </ul>
    }

    <!-- FAB: anchored to the mobile column, above the bottom nav -->
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md"
    >
      <a
        routerLink="/field-officer/deliveries/create"
        class="pointer-events-auto absolute bottom-20 right-4 flex h-14 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-lg transition hover:opacity-90"
        aria-label="Create delivery"
      >
        <ng-icon name="lucidePlus" size="1.5rem" />
        Deliveries
      </a>
    </div>
  `,
})
export class DeliveriesPage {
  private readonly store = inject(FieldOfficerDeliveriesStore);
  private readonly dispatcher = inject(Dispatcher);

  protected readonly deliveries = this.store.sorted;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;

  constructor() {
    // Loads on first visit; serves the cache on subsequent visits.
    this.dispatcher.dispatch(fieldOfficerDeliveriesPageEvents.opened());
  }

  protected load(): void {
    this.dispatcher.dispatch(fieldOfficerDeliveriesPageEvents.reloaded());
  }
}
