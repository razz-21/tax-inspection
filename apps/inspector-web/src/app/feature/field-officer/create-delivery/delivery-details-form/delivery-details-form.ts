import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  FormField,
  required,
  schema,
  type FieldTree,
} from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePackageCheck } from '@ng-icons/lucide';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { SectionCard } from '../section-card/section-card';

export const MERIDIEMS = ['AM', 'PM'] as const;
export type Meridiem = (typeof MERIDIEMS)[number];

export interface DeliveryDetailsModel {
  date: Date | null;
  time: string;
  meridiem: Meridiem | '';
  placeOfDelivery: string;
  quantity: string;
  receiptNumber: string;
  remarks: string;
}

export const emptyDeliveryDetails = (): DeliveryDetailsModel => ({
  date: new Date(),
  time: '',
  meridiem: '',
  placeOfDelivery: '',
  quantity: '',
  receiptNumber: '',
  remarks: '',
});

/** Reusable validation schema for the Delivery Details section. */
export const deliveryDetailsSchema = schema<DeliveryDetailsModel>((path) => {
  required(path.date, { message: 'Date is required.' });
  required(path.time, { message: 'Time is required.' });
  required(path.meridiem, { message: 'Select AM or PM.' });
  required(path.placeOfDelivery, { message: 'Place of delivery is required.' });
  required(path.quantity, { message: 'Quantity is required.' });
  required(path.receiptNumber, { message: 'Receipt number is required.' });
  // Remarks is optional — no validation.
});

/** Delivery Details part of the create-delivery form. */
@Component({
  selector: 'app-delivery-details-form',
  imports: [
    FormField,
    NgIcon,
    SectionCard,
    HlmDatePickerImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  providers: [provideIcons({ lucidePackageCheck })],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delivery-details-form.html',
})
export class DeliveryDetailsForm {
  protected readonly meridiems = MERIDIEMS;

  /** The `deliveryDetails` field group from the parent delivery form. */
  readonly field = input.required<FieldTree<DeliveryDetailsModel>>();

  protected selectDate(date: Date | null): void {
    this.field().date().value.set(date);
    this.field().date().markAsTouched();
  }

  protected selectMeridiem(value: Meridiem): void {
    this.field().meridiem().value.set(value);
    this.field().meridiem().markAsTouched();
  }
}
