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
  lucideClipboardList,
  lucidePackageCheck,
  lucidePlus,
  lucideTrash2,
  lucideTruck,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { Dispatcher, Events } from '@ngrx/signals/events';
import type { Delivery, DeliveryInspection } from '@tax-inspection/shared';
import { DeliveriesService } from '../../../service/deliveries.service';
import { UsersService } from '../../../service/users.service';
import { DeliveryInspectionsStore } from '../../../store/delivery-inspections/delivery-inspections.store';
import {
  deliveryInspectionsApiEvents,
  deliveryInspectionsPageEvents,
} from '../../../store/delivery-inspections/delivery-inspections.events';
import { SectionCard } from '../create-delivery/section-card/section-card';

/** Read-only view of a single delivery (mobile). */
@Component({
  selector: 'app-delivery-detail-page',
  imports: [
    RouterLink,
    NgIcon,
    SectionCard,
    BrnAlertDialogContent,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmCardImports,
    HlmSkeletonImports,
    HlmTabsImports,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideBuilding2,
      lucideTruck,
      lucideBoxes,
      lucideClipboardList,
      lucidePackageCheck,
      lucidePlus,
      lucideTrash2,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delivery-detail.page.html',
})
export class DeliveryDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(DeliveriesService);
  private readonly users = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  /** Delivery inspections live in their own SignalStore (events + entities). */
  protected readonly inspectionsStore = inject(DeliveryInspectionsStore);
  private readonly dispatcher = inject(Dispatcher);
  private readonly events = inject(Events);

  /** Initial tab — `?tab=inspections` opens the Inspections tab directly. */
  protected readonly activeTab =
    this.route.snapshot.queryParamMap.get('tab') === 'inspections'
      ? 'inspections'
      : 'details';

  protected readonly delivery = signal<Delivery | null>(null);
  protected readonly creator = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Inspection queued for deletion — drives the confirmation dialog. */
  protected readonly pendingDelete = signal<DeliveryInspection | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
    // React to inspection delete outcomes dispatched by the store.
    this.events
      .on(deliveryInspectionsApiEvents.removedSuccess)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        toast.success('Inspection deleted.');
        this.pendingDelete.set(null);
        this.deleting.set(false);
      });

    this.events
      .on(deliveryInspectionsApiEvents.removedFailure)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        toast.error('Failed to delete inspection.');
        this.deleting.set(false);
      });

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
          this.loadCreator(delivery.created_by);
        },
        error: () => {
          this.error.set('Failed to load this delivery.');
          this.loading.set(false);
        },
      });

    // Load this delivery's inspections through the store.
    this.dispatcher.dispatch(deliveryInspectionsPageEvents.opened(id));
  }

  /** Open the confirmation dialog for the given inspection. */
  protected askDelete(inspection: DeliveryInspection): void {
    this.pendingDelete.set(inspection);
  }

  /** Delete the queued inspection after confirmation. */
  protected confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;

    this.deleting.set(true);
    this.dispatcher.dispatch(deliveryInspectionsPageEvents.removed(target.id));
  }

  /** Resolve the creator's name from the `created_by` user id. */
  private loadCreator(userId: string): void {
    this.creator.set(null);
    this.users
      .getById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => this.creator.set(user.fullname),
        error: () => this.creator.set(null),
      });
  }
}
