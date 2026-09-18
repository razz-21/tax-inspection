import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideMapPin,
  lucidePackage,
  lucidePlus,
} from '@ng-icons/lucide';

type DeliveryStatus = 'Pending' | 'In transit' | 'Delivered';

interface Delivery {
  id: string;
  recipient: string;
  address: string;
  status: DeliveryStatus;
}

/** Field officer's delivery list (mobile). */
@Component({
  selector: 'app-deliveries-page',
  imports: [RouterLink, NgIcon],
  providers: [
    provideIcons({ lucidePackage, lucideMapPin, lucideChevronRight, lucidePlus }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4"
    >
      <h1 class="text-lg font-semibold">Deliveries</h1>
    </header>

    <ul class="divide-y">
      @for (delivery of deliveries; track delivery.id) {
        <li class="flex items-center gap-3 px-4 py-3">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <ng-icon name="lucidePackage" size="1.25rem" />
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <p class="truncate font-medium">{{ delivery.recipient }}</p>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                [class]="statusClass(delivery.status)"
              >
                {{ delivery.status }}
              </span>
            </div>
            <p
              class="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground"
            >
              <ng-icon name="lucideMapPin" size="0.875rem" />
              {{ delivery.address }}
            </p>
          </div>

          <ng-icon
            name="lucideChevronRight"
            size="1.125rem"
            class="shrink-0 text-muted-foreground"
          />
        </li>
      } @empty {
        <li class="px-4 py-10 text-center text-sm text-muted-foreground">
          No deliveries assigned.
        </li>
      }
    </ul>

    <!-- FAB: anchored to the mobile column, above the bottom nav -->
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md"
    >
      <a
        routerLink="/field-officer/deliveries/create"
        class="pointer-events-auto absolute bottom-20 right-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90"
        aria-label="Create delivery"
      >
        <ng-icon name="lucidePlus" size="1.5rem" />
      </a>
    </div>
  `,
})
export class DeliveriesPage {
  protected readonly deliveries: Delivery[] = [
    {
      id: 'DLV-1001',
      recipient: 'Acme Retail Co.',
      address: '12 Market St, Downtown',
      status: 'Pending',
    },
    {
      id: 'DLV-1002',
      recipient: 'Bright Foods Ltd.',
      address: '48 Harbor Ave, Eastside',
      status: 'In transit',
    },
    {
      id: 'DLV-1003',
      recipient: 'Green Grocers',
      address: '7 Oak Lane, Uptown',
      status: 'Delivered',
    },
  ];

  protected statusClass(status: DeliveryStatus): string {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700';
      case 'In transit':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }
}
