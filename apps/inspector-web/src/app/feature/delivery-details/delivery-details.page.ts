import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCalculator,
  lucideCheck,
  lucideChevronDown,
  lucideCreditCard,
  lucideHouse,
  lucideLayers,
  lucideMapPin,
  lucidePencil,
  lucidePlus,
  lucideTrash2,
  lucideTruck,
} from '@ng-icons/lucide';
import { firstValueFrom } from 'rxjs';
import type { HttpErrorResponse } from '@angular/common/http';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import {
  type Delivery,
  type DeliveryStatus,
  type Payment,
  type PaymentStatus,
  type PostPayment,
  type TaxAssessment,
} from '@tax-inspection/shared';
import { DeliveriesService } from '../../service/deliveries.service';
import {
  DELIVERY_STATUS_ICONS,
  DELIVERY_STATUS_META,
  DELIVERY_STATUS_OPTIONS,
} from '../../util/delivery-status';
import { PaymentsService } from '../../service/payments.service';
import { TaxAssessmentsService } from '../../service/tax-assessments.service';
import { DeliveryInspectionsStore } from '../../store/delivery-inspections/delivery-inspections.store';
import { deliveryInspectionsPageEvents } from '../../store/delivery-inspections/delivery-inspections.events';
import { deliveriesApiEvents } from '../../store/deliveries/deliveries.events';
import { ConfirmDialog } from './confirm-dialog/confirm-dialog';
import {
  PaymentDialog,
  type PaymentDialogResult,
} from './payment-dialog/payment-dialog';

/** Back-office read-only view of a single delivery. */
@Component({
  selector: 'app-delivery-details-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    NgIcon,
    HlmButtonImports,
    HlmSkeletonImports,
    ConfirmDialog,
    PaymentDialog,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideHouse,
      lucideTruck,
      lucideLayers,
      lucideMapPin,
      lucideCreditCard,
      lucideCalculator,
      lucidePencil,
      lucidePlus,
      lucideTrash2,
      lucideChevronDown,
      lucideCheck,
      ...DELIVERY_STATUS_ICONS,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delivery-details.page.html',
})
export class DeliveryDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(DeliveriesService);
  private readonly taxService = inject(TaxAssessmentsService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly dispatcher = inject(Dispatcher);
  private readonly destroyRef = inject(DestroyRef);

  /** Inspections come from the shared SignalStore (events + entities). */
  protected readonly inspectionsStore = inject(DeliveryInspectionsStore);

  protected readonly delivery = signal<Delivery | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // --- Delete delivery ---
  protected readonly confirmDeleteDelivery = signal(false);
  protected readonly deletingDelivery = signal(false);

  // --- Status ---
  protected readonly statusOptions = DELIVERY_STATUS_OPTIONS;
  protected readonly statusMenuOpen = signal(false);
  protected readonly updatingStatus = signal(false);
  /** Presentation (icon + badge) for the delivery's current status. */
  protected readonly statusMeta = computed(() => {
    const status = this.delivery()?.status ?? 'In Review';
    return DELIVERY_STATUS_META[status];
  });

  protected readonly inspectionsCount = computed(
    () => this.inspectionsStore.entities().length,
  );

  /** Placeholder rows while the inspections table loads. */
  protected readonly skeletonRows = Array.from({ length: 3 });

  // --- Tax assessment ---
  protected readonly assessment = signal<TaxAssessment | null>(null);
  protected readonly calculatingTax = signal(false);
  /** Drives the "delete assessment?" confirmation dialog. */
  protected readonly confirmDeleteAssessment = signal(false);
  protected readonly deletingAssessment = signal(false);

  // --- Payment ---
  protected readonly paymentOpen = signal(false);
  protected readonly savingPayment = signal(false);
  protected readonly payments = signal<Payment[]>([]);
  /** When set, the dialog edits this payment instead of creating a new one. */
  protected readonly editingPayment = signal<Payment | null>(null);
  /** Upper bound + prefill for the payment amount. */
  protected readonly assessedTax = computed(
    () => this.assessment()?.computed_tax ?? null,
  );
  /** Payment queued for deletion — drives the confirmation dialog. */
  protected readonly pendingDeletePayment = signal<Payment | null>(null);
  protected readonly deletingPayment = signal(false);

  constructor() {
    this.load();
  }

  protected toggleStatusMenu(): void {
    this.statusMenuOpen.update((open) => !open);
  }

  /** Delete this delivery, then return to the list. */
  protected async deleteDelivery(): Promise<void> {
    const current = this.delivery();
    if (!current) return;

    this.deletingDelivery.set(true);
    try {
      await firstValueFrom(this.service.remove(current.id));
      // Drop it from the cached list so it disappears immediately.
      this.dispatcher.dispatch(deliveriesApiEvents.removed(current.id));
      this.confirmDeleteDelivery.set(false);
      toast.success('Delivery deleted.');
      await this.router.navigateByUrl('/main/deliveries');
    } catch (err) {
      const message =
        (err as HttpErrorResponse)?.error?.error ?? 'Failed to delete delivery.';
      toast.error(message);
    } finally {
      this.deletingDelivery.set(false);
    }
  }

  /** Update the delivery's workflow status via PATCH and reflect it locally. */
  protected async updateStatus(status: DeliveryStatus): Promise<void> {
    this.statusMenuOpen.set(false);
    const current = this.delivery();
    if (!current || current.status === status) return;

    this.updatingStatus.set(true);
    try {
      const updated = await firstValueFrom(
        this.service.update(current.id, { status }),
      );
      this.delivery.set(updated);
      // Keep the admin deliveries list cache in sync.
      this.dispatcher.dispatch(deliveriesApiEvents.updated(updated));
      toast.success(`Status updated to ${status}.`);
    } catch (err) {
      const message =
        (err as HttpErrorResponse)?.error?.error ?? 'Failed to update status.';
      toast.error(message);
    } finally {
      this.updatingStatus.set(false);
    }
  }

  protected openPayment(): void {
    this.editingPayment.set(null);
    this.paymentOpen.set(true);
  }

  protected openPaymentForEdit(p: Payment): void {
    this.editingPayment.set(p);
    this.paymentOpen.set(true);
  }

  protected paymentStatusBadge(status: PaymentStatus): string {
    const base =
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium';
    const colors: Record<PaymentStatus, string> = {
      Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      Pending:
        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      Hold: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };
    return `${base} ${colors[status]}`;
  }

  protected async onPaymentSave(result: PaymentDialogResult): Promise<void> {
    const deliveryId = this.delivery()?.id;
    const assessmentId = this.assessment()?.id;
    if (!deliveryId) return;
    if (!assessmentId) {
      toast.error('Calculate the tax assessment before recording a payment.');
      return;
    }

    const editing = this.editingPayment();
    this.savingPayment.set(true);
    try {
      let saved: Payment;
      if (editing) {
        saved = await firstValueFrom(
          this.paymentsService.update(editing.id, result),
        );
        this.payments.update((list) =>
          list.map((p) => (p.id === saved.id ? saved : p)),
        );
      } else {
        const body: PostPayment = {
          delivery_id: deliveryId,
          tax_assessment: assessmentId,
          ...result,
        };
        saved = await firstValueFrom(this.paymentsService.create(body));
        this.payments.update((list) => [saved, ...list]);
      }
      this.paymentOpen.set(false);
      toast.success(editing ? 'Payment updated.' : 'Payment recorded.');
    } catch (err) {
      const message =
        (err as HttpErrorResponse)?.error?.error ?? 'Failed to save payment.';
      toast.error(message);
    } finally {
      this.savingPayment.set(false);
    }
  }

  protected deletePayment(): void {
    const target = this.pendingDeletePayment();
    if (!target) return;

    this.deletingPayment.set(true);
    this.paymentsService
      .remove(target.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.payments.update((list) =>
            list.filter((p) => p.id !== target.id),
          );
          toast.success('Payment deleted.');
          this.pendingDeletePayment.set(null);
          this.deletingPayment.set(false);
        },
        error: () => {
          toast.error('Failed to delete payment.');
          this.deletingPayment.set(false);
        },
      });
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
          // Opening a brand-new delivery marks it as seen (is_new -> false).
          if (delivery.is_new) {
            this.markSeen(delivery.id);
          }
        },
        error: () => {
          this.error.set('Failed to load this delivery.');
          this.loading.set(false);
        },
      });

    // Load this delivery's inspections through the store.
    this.dispatcher.dispatch(deliveryInspectionsPageEvents.opened(id));

    // Load the most recent tax assessment, if any.
    this.taxService
      .list({ delivery_id: id, sortBy: 'created_at', sortOrder: 'desc', limit: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.assessment.set(res.data[0] ?? null),
        error: () => this.assessment.set(null),
      });

    // Load this delivery's payments, newest first.
    this.paymentsService
      .list({ delivery_id: id, sortBy: 'created_at', sortOrder: 'desc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.payments.set(res.data),
        error: () => this.payments.set([]),
      });
  }

  /**
   * Clear the `is_new` flag the first time a delivery is opened. Only touches
   * `is_new` — nothing else about the delivery changes.
   */
  private markSeen(id: string): void {
    this.service
      .update(id, { is_new: false })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.delivery.set(updated);
          // Clear the "New" badge in the cached list too.
          this.dispatcher.dispatch(deliveriesApiEvents.updated(updated));
        },
        error: () => {
          /* non-critical — leave the flag as-is on failure */
        },
      });
  }

  protected async calculateTax(): Promise<void> {
    const id = this.delivery()?.id;
    if (!id) return;

    this.calculatingTax.set(true);
    try {
      const result = await firstValueFrom(this.taxService.calculate(id));
      this.assessment.set(result);
      toast.success('Tax assessment calculated.');
    } catch (err) {
      const message =
        (err as HttpErrorResponse)?.error?.error ?? 'Failed to calculate tax.';
      toast.error(message);
    } finally {
      this.calculatingTax.set(false);
    }
  }

  protected deleteAssessment(): void {
    const current = this.assessment();
    if (!current) return;

    this.deletingAssessment.set(true);
    this.taxService
      .remove(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assessment.set(null);
          toast.success('Tax assessment deleted.');
          this.confirmDeleteAssessment.set(false);
          this.deletingAssessment.set(false);
        },
        error: () => {
          toast.error('Failed to delete tax assessment.');
          this.deletingAssessment.set(false);
        },
      });
  }
}
