import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { form, required, submit, FormField } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { Dispatcher, Events } from '@ngrx/signals/events';
import type { PostDeliveryInspection } from '@tax-inspection/shared';
import { DeliveryInspectionsStore } from '../../../store/delivery-inspections/delivery-inspections.store';
import {
  deliveryInspectionsApiEvents,
  deliveryInspectionsPageEvents,
} from '../../../store/delivery-inspections/delivery-inspections.events';

/** Fields captured when recording an inspection for a delivery. */
interface InspectionFormModel {
  inspectionDate: Date | null;
  actualVolume: number | null;
  allowedVolume: number | null;
  remarks: string;
}

const emptyInspectionForm = (): InspectionFormModel => ({
  inspectionDate: new Date(),
  actualVolume: null,
  allowedVolume: null,
  remarks: '',
});

/** Format a local date as `yyyy-mm-dd` (avoids UTC day-shift from toISOString). */
function formatDate(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Add-inspection form for a delivery (mobile). */
@Component({
  selector: 'app-add-inspection-page',
  imports: [
    RouterLink,
    NgIcon,
    FormField,
    HlmButtonImports,
    HlmDatePickerImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-inspection.page.html',
})
export class AddInspectionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dispatcher = inject(Dispatcher);
  private readonly events = inject(Events);
  // Injected so the store (and its create effect) is instantiated.
  private readonly inspectionsStore = inject(DeliveryInspectionsStore);

  protected readonly deliveryId = this.route.snapshot.paramMap.get('id');
  protected readonly submitting = signal(false);

  protected readonly model = signal<InspectionFormModel>(emptyInspectionForm());

  protected readonly inspectionForm = form(this.model, (path) => {
    required(path.inspectionDate, { message: 'Inspection date is required.' });
    required(path.actualVolume, { message: 'Actual volume is required.' });
    required(path.allowedVolume, { message: 'Allowed volume is required.' });
    // Remarks is optional — no validation.
  });

  constructor() {
    // Navigate back to the delivery's Inspections tab once the store confirms.
    this.events
      .on(deliveryInspectionsApiEvents.createdSuccess)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        toast.success('Inspection saved successfully.');
        this.submitting.set(false);
        if (this.deliveryId) {
          this.router.navigate(
            ['/field-officer/deliveries', this.deliveryId],
            { queryParams: { tab: 'inspections' } },
          );
        }
      });

    this.events
      .on(deliveryInspectionsApiEvents.createdFailure)
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        toast.error(event.payload || 'Failed to save inspection.');
        this.submitting.set(false);
      });
  }

  protected selectDate(date: Date | null): void {
    this.inspectionForm.inspectionDate().value.set(date);
    this.inspectionForm.inspectionDate().markAsTouched();
  }

  protected async onSubmit(): Promise<void> {
    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.inspectionForm, async () => undefined);
    if (!valid) return;

    if (!this.deliveryId) {
      toast.error('Missing delivery reference.');
      return;
    }

    this.submitting.set(true);
    this.dispatcher.dispatch(
      deliveryInspectionsPageEvents.created(this.toPayload(this.deliveryId)),
    );
  }

  /** Map the form model to the API payload (`user_id` is set server-side). */
  private toPayload(deliveryId: string): PostDeliveryInspection {
    const { inspectionDate, actualVolume, allowedVolume, remarks } = this.model();
    return {
      delivery_id: deliveryId,
      inspection_date: formatDate(inspectionDate),
      actual_volume: Number(actualVolume),
      allowed_volume: Number(allowedVolume),
      remarks,
    };
  }
}
