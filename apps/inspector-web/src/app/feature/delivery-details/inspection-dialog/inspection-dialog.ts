import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';

/** Values collected by the inspection form (delivery context added by the page). */
export interface InspectionDialogResult {
  inspection_date: string;
  actual_volume: number;
  allowed_volume: number;
  remarks: string;
}

interface InspectionFormModel {
  inspectionDate: Date | null;
  actualVolume: number | null;
  allowedVolume: number | null;
  remarks: string;
}

const emptyModel = (): InspectionFormModel => ({
  inspectionDate: new Date(),
  actualVolume: null,
  allowedVolume: null,
  remarks: '',
});

/** Format a local date as `yyyy-mm-dd` (avoids UTC day-shift). */
function formatDate(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Modal form for recording an inspection against a delivery. */
@Component({
  selector: 'app-inspection-dialog',
  imports: [
    FormField,
    BrnAlertDialogContent,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmDatePickerImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inspection-dialog.html',
})
export class InspectionDialog {
  readonly open = input(false);
  readonly saving = input(false);

  readonly save = output<InspectionDialogResult>();
  readonly closed = output<void>();

  protected readonly model = signal<InspectionFormModel>(emptyModel());

  protected readonly inspectionForm = form(this.model, (path) => {
    required(path.inspectionDate, { message: 'Inspection date is required.' });
    required(path.actualVolume, { message: 'Actual volume is required.' });
    required(path.allowedVolume, { message: 'Allowed volume is required.' });
    // Remarks is optional.
  });

  constructor() {
    // Reset the form each time the dialog opens.
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.model.set(emptyModel());
        this.inspectionForm().reset();
      });
    });
  }

  protected selectInspectionDate(date: Date | null): void {
    this.inspectionForm.inspectionDate().value.set(date);
    this.inspectionForm.inspectionDate().markAsTouched();
  }

  protected async onSubmit(): Promise<void> {
    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.inspectionForm, async () => undefined);
    if (!valid) return;

    const m = this.model();
    this.save.emit({
      inspection_date: formatDate(m.inspectionDate),
      actual_volume: Number(m.actualVolume),
      allowed_volume: Number(m.allowedVolume),
      remarks: m.remarks,
    });
  }
}
