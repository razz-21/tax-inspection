import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBoxes,
  lucideCalendar,
  lucideChevronRight,
  lucideCloudOff,
  lucideMapPin,
  lucidePackage,
  lucidePlus,
  lucideTruck,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { Dispatcher } from '@ngrx/signals/events';
import { NetworkService } from '../../../service/network.service';
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
      lucidePlus,
      lucideChevronRight,
      lucideCloudOff,
      lucideMapPin,
      lucideTruck,
      lucideBoxes,
      lucideCalendar,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4"
    >
      <h1 class="text-lg font-semibold">Deliveries</h1>
      @if (!online()) {
        <span
          class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
        >
          <ng-icon name="lucideCloudOff" size="0.85rem" />
          Offline
        </span>
      }
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
    } @else if (error() && !online()) {
      <div class="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span
          class="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700"
        >
          <ng-icon name="lucideCloudOff" size="1.5rem" />
        </span>
        <p class="font-medium">Can't load deliveries — you're offline</p>
        <p class="text-sm text-muted-foreground">
          We couldn't fetch your deliveries without a connection. You can still
          create deliveries now and sync them once you're back online.
        </p>
        <div class="mt-1 flex flex-col items-stretch gap-2">
          <a hlmBtn routerLink="/field-officer/deliveries/create">
            Create delivery
          </a>
          <button hlmBtn variant="outline" (click)="load()">Try again</button>
        </div>
      </div>
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
              class="flex items-start gap-3 px-4 py-3.5 transition hover:bg-accent"
            >
              <span
                class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <ng-icon name="lucidePackage" size="1.2rem" />
              </span>

              <div class="min-w-0 flex-1 space-y-2">
                <!-- Source of materials + material type -->
                <div class="flex items-center gap-2">
                  <p class="min-w-0 flex-1 truncate text-lg font-semibold">
                    {{ delivery.materials.source_of_material }}
                  </p>
                  <span
                    class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-medium capitalize text-emerald-700"
                  >
                    {{ delivery.materials.material_type }}
                  </span>
                </div>

                <!-- Place of delivery -->
                <p class="flex items-center gap-1.5 text-base text-muted-foreground">
                  <ng-icon name="lucideMapPin" size="1.05rem" class="shrink-0" />
                  <span class="truncate">{{ delivery.place_of_deliveries }}</span>
                </p>

                <!-- Truck · Quantity · Date & Time -->
                <div
                  class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
                >
                  <span class="inline-flex items-center gap-1.5">
                    <ng-icon name="lucideTruck" size="1.05rem" />
                    <span class="capitalize">{{ delivery.truck.truck_type }}</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <ng-icon name="lucideBoxes" size="1.05rem" />
                    Qty {{ delivery.quantity }}
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <ng-icon name="lucideCalendar" size="1.05rem" />
                    {{ delivery.date }} · {{ delivery.time }}
                  </span>
                </div>
              </div>

              <ng-icon
                name="lucideChevronRight"
                size="1.125rem"
                class="mt-1 shrink-0 self-center text-muted-foreground"
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
  protected readonly online = inject(NetworkService).online;

  constructor() {
    // Loads on first visit; serves the cache on subsequent visits.
    this.dispatcher.dispatch(fieldOfficerDeliveriesPageEvents.opened());
  }

  protected load(): void {
    this.dispatcher.dispatch(fieldOfficerDeliveriesPageEvents.reloaded());
  }
}
