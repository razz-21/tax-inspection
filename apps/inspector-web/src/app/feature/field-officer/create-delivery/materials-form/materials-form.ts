import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  FormField,
  required,
  schema,
  type FieldTree,
} from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBoxes, lucideMountain } from '@ng-icons/lucide';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { SectionCard } from '../section-card/section-card';

export const MATERIAL_TYPES = [
  'Sand',
  'Gravel',
  'Stones',
  'Filling Materials',
] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const MATERIAL_UNITS = ['Cubic Meter - m³'] as const;
export type MaterialUnit = (typeof MATERIAL_UNITS)[number];

export interface MaterialsModel {
  source: string;
  materialType: MaterialType | '';
  unit: MaterialUnit | '';
}

export const emptyMaterials = (): MaterialsModel => ({
  source: '',
  materialType: '',
  unit: '',
});

/** Reusable validation schema for the Materials section. */
export const materialsSchema = schema<MaterialsModel>((path) => {
  required(path.source, { message: 'Source of material is required.' });
  required(path.materialType, { message: 'Material type is required.' });
  required(path.unit, { message: 'Unit is required.' });
});

/** Materials part of the create-delivery form. */
@Component({
  selector: 'app-materials-form',
  imports: [
    FormField,
    NgIcon,
    SectionCard,
    HlmInputImports,
    HlmLabelImports,
    HlmSelectImports,
  ],
  providers: [provideIcons({ lucideBoxes, lucideMountain })],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './materials-form.html',
})
export class MaterialsForm {
  protected readonly materialTypes = MATERIAL_TYPES;
  protected readonly units = MATERIAL_UNITS;

  /** The `materials` field group from the parent delivery form. */
  readonly field = input.required<FieldTree<MaterialsModel>>();

  protected selectMaterialType(value: MaterialType): void {
    this.field().materialType().value.set(value);
    this.field().materialType().markAsTouched();
  }

  protected setUnit(value: unknown): void {
    this.field().unit().value.set(value as MaterialUnit);
  }
}
