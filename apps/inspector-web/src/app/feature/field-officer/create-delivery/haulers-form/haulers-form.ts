import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  FormField,
  required,
  schema,
  type FieldTree,
} from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBuilding2, lucideMapPin } from '@ng-icons/lucide';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { SectionCard } from '../section-card/section-card';

export interface HaulerModel {
  name: string;
  address: string;
  contactNumber: string;
}

export const emptyHauler = (): HaulerModel => ({
  name: '',
  address: '',
  contactNumber: '',
});

/** Reusable validation schema for the Haulers section. */
export const haulerSchema = schema<HaulerModel>((path) => {
  required(path.name, { message: "Hauler's name is required." });
  required(path.address, { message: 'Address is required.' });
  // Contact number is optional — no validation.
});

/** Haulers part of the create-delivery form. */
@Component({
  selector: 'app-haulers-form',
  imports: [
    FormField,
    NgIcon,
    SectionCard,
    HlmInputImports,
    HlmLabelImports,
  ],
  providers: [provideIcons({ lucideBuilding2, lucideMapPin })],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './haulers-form.html',
})
export class HaulersForm {
  /** The `hauler` field group from the parent delivery form. */
  readonly field = input.required<FieldTree<HaulerModel>>();
}
