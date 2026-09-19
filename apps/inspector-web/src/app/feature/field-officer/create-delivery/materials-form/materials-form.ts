import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormField,
  required,
  schema,
  type FieldTree,
} from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBoxes, lucideMountain, lucidePlus } from '@ng-icons/lucide';
import { Dispatcher } from '@ngrx/signals/events';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { SourceOfMaterialsStore } from '../../../../store/source-of-materials/source-of-materials.store';
import { sourceOfMaterialsPageEvents } from '../../../../store/source-of-materials/source-of-materials.events';
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
  providers: [provideIcons({ lucideBoxes, lucideMountain, lucidePlus })],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './materials-form.html',
})
export class MaterialsForm implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly store = inject(SourceOfMaterialsStore);

  protected readonly materialTypes = MATERIAL_TYPES;
  protected readonly units = MATERIAL_UNITS;

  /** The `materials` field group from the parent delivery form. */
  readonly field = input.required<FieldTree<MaterialsModel>>();

  /** Whether the source-of-material suggestions panel is visible. */
  protected readonly panelOpen = signal(false);

  /** The current text typed into the source field. */
  private readonly query = computed(() => this.field().source().value().trim());

  /** Sources matching the typed text (all when the field is empty). */
  protected readonly suggestions = computed(() => {
    const q = this.query().toLowerCase();
    const all = this.store.sorted();
    return q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all;
  });

  /** True when the typed text doesn't exactly match an existing source. */
  protected readonly canAdd = computed(() => {
    const q = this.query();
    if (!q) return false;
    return !this.store
      .sorted()
      .some((s) => s.name.toLowerCase() === q.toLowerCase());
  });

  ngOnInit(): void {
    // Ensure the list is available (no-op if already cached / prefetched).
    this.dispatcher.dispatch(sourceOfMaterialsPageEvents.opened());
  }

  protected openPanel(): void {
    this.panelOpen.set(true);
  }

  /** Close after a tick so an option click registers before the blur. */
  protected closePanelSoon(): void {
    setTimeout(() => this.panelOpen.set(false), 150);
  }

  protected selectSource(name: string): void {
    this.field().source().value.set(name);
    this.field().source().markAsTouched();
    this.panelOpen.set(false);
  }

  /** Create the typed source (empty description) and select it. */
  protected addSource(): void {
    const name = this.query();
    if (!name) return;
    this.dispatcher.dispatch(
      sourceOfMaterialsPageEvents.created({ name, description: '' }),
    );
    this.selectSource(name);
  }

  protected selectMaterialType(value: MaterialType): void {
    this.field().materialType().value.set(value);
    this.field().materialType().markAsTouched();
  }

  protected setUnit(value: unknown): void {
    this.field().unit().value.set(value as MaterialUnit);
  }
}
