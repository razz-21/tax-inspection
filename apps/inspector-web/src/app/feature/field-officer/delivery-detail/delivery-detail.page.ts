import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBoxes,
  lucideBuilding2,
  lucidePackageCheck,
  lucidePlus,
  lucideTruck,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import type { Delivery } from '@tax-inspection/shared';
import { DeliveriesService } from '../../../service/deliveries.service';
import { SectionCard } from '../create-delivery/section-card/section-card';

/** Read-only view of a single delivery (mobile). */
@Component({
  selector: 'app-delivery-detail-page',
  imports: [
    RouterLink,
    NgIcon,
    SectionCard,
    HlmButtonImports,
    HlmSkeletonImports,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideBuilding2,
      lucideTruck,
      lucideBoxes,
      lucidePackageCheck,
      lucidePlus,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delivery-detail.page.html',
})
export class DeliveryDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(DeliveriesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly delivery = signal<Delivery | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Delivery not found.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.service
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (delivery) => {
          this.delivery.set(delivery);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load this delivery.');
          this.loading.set(false);
        },
      });
  }
}
