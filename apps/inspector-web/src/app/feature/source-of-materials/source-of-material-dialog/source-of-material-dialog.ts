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
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import type {
  PostSourceOfMaterial,
  SourceOfMaterial,
} from '@tax-inspection/shared';

interface SourceOfMaterialFormModel {
  name: string;
  description: string;
}

const emptyModel = (): SourceOfMaterialFormModel => ({
  name: '',
  description: '',
});

/** Modal form for creating a source of materials. */
@Component({
  selector: 'app-source-of-material-dialog',
  imports: [
    FormField,
    BrnAlertDialogContent,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmTextareaImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-of-material-dialog.html',
})
export class SourceOfMaterialDialog {
  readonly open = input(false);
  /** When set, the dialog edits this record; otherwise it creates one. */
  readonly editing = input<SourceOfMaterial | null>(null);
  readonly saving = input(false);

  readonly save = output<PostSourceOfMaterial>();
  readonly closed = output<void>();

  protected readonly model = signal<SourceOfMaterialFormModel>(emptyModel());

  protected readonly sourceForm = form(this.model, (path) => {
    required(path.name, { message: 'Name is required.' });
  });

  constructor() {
    // Prefill / reset the form each time the dialog opens.
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        const editing = this.editing();
        this.model.set(
          editing
            ? { name: editing.name, description: editing.description }
            : emptyModel(),
        );
        this.sourceForm().reset();
      });
    });
  }

  protected async onSubmit(): Promise<void> {
    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.sourceForm, async () => undefined);
    if (!valid) return;

    const m = this.model();
    this.save.emit({
      name: m.name.trim(),
      description: m.description.trim(),
    });
  }
}
