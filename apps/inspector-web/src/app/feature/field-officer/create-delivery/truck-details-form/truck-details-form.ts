import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  FormField,
  required,
  schema,
  type FieldTree,
} from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTruck } from '@ng-icons/lucide';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { SectionCard } from '../section-card/section-card';

export const TRUCK_TYPES = ['10 Wheelers', '8 Wheelers', '6 Wheelers'] as const;
export type TruckType = (typeof TRUCK_TYPES)[number];

export interface TruckDetailsModel {
  driverName: string;
  licenseNumber: string;
  plateNumber: string;
  truckType: TruckType | '';
}

export const emptyTruckDetails = (): TruckDetailsModel => ({
  driverName: '',
  licenseNumber: '',
  plateNumber: '',
  truckType: '',
});

/** Reusable validation schema for the Truck Details section. */
export const truckDetailsSchema = schema<TruckDetailsModel>((path) => {
  // Driver's name and license number are optional.
  required(path.plateNumber, { message: 'Plate number is required.' });
  required(path.truckType, { message: 'Truck type is required.' });
});

/** Truck Details part of the create-delivery form. */
@Component({
  selector: 'app-truck-details-form',
  imports: [
    FormField,
    NgIcon,
    SectionCard,
    HlmInputImports,
    HlmLabelImports,
  ],
  providers: [provideIcons({ lucideTruck })],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './truck-details-form.html',
})
export class TruckDetailsForm {
  protected readonly truckTypes = TRUCK_TYPES;

  /** The `truckDetails` field group from the parent delivery form. */
  readonly field = input.required<FieldTree<TruckDetailsModel>>();

  protected selectTruckType(value: TruckType): void {
    this.field().truckType().value.set(value);
    this.field().truckType().markAsTouched();
  }
}
