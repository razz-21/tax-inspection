import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { apply, form, submit } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideInfo } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import type {
  MaterialType,
  MaterialUnit,
  PostDelivery,
  TruckType,
} from '@tax-inspection/shared';
import { Dispatcher } from '@ngrx/signals/events';
import { DeliveriesService } from '../../../service/deliveries.service';
import { fieldOfficerDeliveriesPageEvents } from '../../../store/field-officer-deliveries/field-officer-deliveries.events';
import {
  emptyHauler,
  haulerSchema,
  HaulersForm,
  type HaulerModel,
} from './haulers-form/haulers-form';
import {
  emptyTruckDetails,
  truckDetailsSchema,
  TruckDetailsForm,
  type TruckDetailsModel,
} from './truck-details-form/truck-details-form';
import {
  emptyMaterials,
  materialsSchema,
  MaterialsForm,
  type MaterialsModel,
} from './materials-form/materials-form';
import {
  emptyDeliveryDetails,
  deliveryDetailsSchema,
  DeliveryDetailsForm,
  type DeliveryDetailsModel,
} from './delivery-details-form/delivery-details-form';

/**
 * The create-delivery form. Built in four parts — Haulers, Truck Details,
 * Materials and Delivery.
 */
interface CreateDeliveryModel {
  hauler: HaulerModel;
  truckDetails: TruckDetailsModel;
  materials: MaterialsModel;
  deliveryDetails: DeliveryDetailsModel;
}

const emptyModel = (): CreateDeliveryModel => ({
  hauler: emptyHauler(),
  truckDetails: emptyTruckDetails(),
  materials: emptyMaterials(),
  deliveryDetails: emptyDeliveryDetails(),
});

/** Format a local date as `yyyy-mm-dd` (avoids UTC day-shift from toISOString). */
function formatDate(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

@Component({
  selector: 'app-create-delivery-page',
  imports: [
    RouterLink,
    NgIcon,
    BrnAlertDialogContent,
    HlmAlertImports,
    HlmAlertDialogImports,
    HlmButtonImports,
    HaulersForm,
    TruckDetailsForm,
    MaterialsForm,
    DeliveryDetailsForm,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideInfo })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-delivery.page.html',
})
export class CreateDeliveryPage {
  private readonly router = inject(Router);
  private readonly deliveries = inject(DeliveriesService);
  private readonly dispatcher = inject(Dispatcher);

  protected readonly submitting = signal(false);
  protected readonly confirmOpen = signal(false);

  protected readonly model = signal<CreateDeliveryModel>(emptyModel());

  protected readonly deliveryForm = form(this.model, (path) => {
    apply(path.hauler, haulerSchema);
    apply(path.truckDetails, truckDetailsSchema);
    apply(path.materials, materialsSchema);
    apply(path.deliveryDetails, deliveryDetailsSchema);
  });

  protected async onSubmit(): Promise<void> {
    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.deliveryForm, async () => undefined);
    if (!valid) return;

    // Valid — ask for confirmation before creating.
    this.confirmOpen.set(true);
  }

  protected async confirmCreate(): Promise<void> {
    this.confirmOpen.set(false);
    this.submitting.set(true);
    try {
      const created = await firstValueFrom(
        this.deliveries.create(this.toPayload()),
      );
      // Keep the cached list fresh so the new delivery shows without a refetch.
      this.dispatcher.dispatch(
        fieldOfficerDeliveriesPageEvents.created(created),
      );
      toast.success('Delivery created successfully.');
      await this.router.navigateByUrl('/field-officer/deliveries');
    } catch (err) {
      const message =
        (err as HttpErrorResponse)?.error?.error ?? 'Failed to create delivery.';
      toast.error(message);
    } finally {
      this.submitting.set(false);
    }
  }

  /** Map the camelCase form model to the snake_case API payload. */
  private toPayload(): PostDelivery {
    const { hauler, truckDetails, materials, deliveryDetails } = this.model();
    return {
      haulers: {
        name: hauler.name,
        address: hauler.address,
        contact_number: hauler.contactNumber,
      },
      truck: {
        drivers_name: truckDetails.driverName,
        license_number: truckDetails.licenseNumber,
        plate_number: truckDetails.plateNumber,
        truck_type: truckDetails.truckType as TruckType,
      },
      materials: {
        source_of_material: materials.source,
        material_type: materials.materialType as MaterialType,
        unit: materials.unit as MaterialUnit,
      },
      date: formatDate(deliveryDetails.date),
      time: `${deliveryDetails.time} ${deliveryDetails.meridiem}`.trim(),
      place_of_deliveries: deliveryDetails.placeOfDelivery,
      quantity: Number(deliveryDetails.quantity),
      receipt_number: deliveryDetails.receiptNumber,
      remarks: deliveryDetails.remarks,
    };
  }
}
