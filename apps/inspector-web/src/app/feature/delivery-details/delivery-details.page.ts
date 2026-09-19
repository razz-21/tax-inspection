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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Dispatcher } from '@ngrx/signals/events';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCalculator,
  lucideCreditCard,
  lucideHouse,
  lucideLayers,
  lucideMapPin,
  lucidePlus,
  lucideTrash2,
  lucideTruck,
} from '@ng-icons/lucide';
import { firstValueFrom } from 'rxjs';
import type { HttpErrorResponse } from '@angular/common/http';
import { toast } from '@spartan-ng/brain/sonner';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import type { Delivery, TaxAssessment } from '@tax-inspection/shared';
import { DeliveriesService } from '../../service/deliveries.service';
import { TaxAssessmentsService } from '../../service/tax-assessments.service';
import { DeliveryInspectionsStore } from '../../store/delivery-inspections/delivery-inspections.store';
import { deliveryInspectionsPageEvents } from '../../store/delivery-inspections/delivery-inspections.events';

/** Payment capture form model. */
interface PaymentModel {
  accountNumber: string;
  paymentDate: Date | null;
  cashierNumber: string;
  receiptNumber: string;
}

const emptyPayment = (): PaymentModel => ({
  accountNumber: '',
  paymentDate: null,
  cashierNumber: '',
  receiptNumber: '',
});

/** Back-office read-only view of a single delivery. */
@Component({
  selector: 'app-delivery-details-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    NgIcon,
    FormField,
    BrnAlertDialogContent,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmDatePickerImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSkeletonImports,
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
      lucidePlus,
      lucideTrash2,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delivery-details.page.html',
})
export class DeliveryDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(DeliveriesService);
  private readonly taxService = inject(TaxAssessmentsService);
  private readonly dispatcher = inject(Dispatcher);
  private readonly destroyRef = inject(DestroyRef);

  /** Inspections come from the shared SignalStore (events + entities). */
  protected readonly inspectionsStore = inject(DeliveryInspectionsStore);

  protected readonly delivery = signal<Delivery | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

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

  // --- Payment (frontend only for now) ---
  protected readonly paymentOpen = signal(false);
  protected readonly payment = signal<PaymentModel | null>(null);
  protected readonly paymentModel = signal<PaymentModel>(emptyPayment());

  protected readonly paymentForm = form(this.paymentModel, (path) => {
    required(path.accountNumber, { message: 'Account number is required.' });
    required(path.paymentDate, { message: 'Payment date is required.' });
    required(path.cashierNumber, { message: 'Cashier number is required.' });
    required(path.receiptNumber, { message: 'Receipt number is required.' });
  });

  constructor() {
    this.load();
  }

  protected openPayment(): void {
    this.paymentModel.set(emptyPayment());
    this.paymentForm().reset();
    this.paymentOpen.set(true);
  }

  protected selectPaymentDate(date: Date | null): void {
    this.paymentForm.paymentDate().value.set(date);
    this.paymentForm.paymentDate().markAsTouched();
  }

  protected async savePayment(): Promise<void> {
    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.paymentForm, async () => undefined);
    if (!valid) return;

    // Frontend only — hold the payment locally and show it on the card.
    this.payment.set({ ...this.paymentModel() });
    this.paymentOpen.set(false);
    toast.success('Payment recorded.');
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
