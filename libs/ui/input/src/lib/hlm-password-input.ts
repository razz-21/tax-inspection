import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { HlmInput } from './hlm-input';

/**
 * Password input with a built-in show/hide toggle (Lucide eye icons).
 * Binds to a Signal Forms field via `[field]`, so pages don't reimplement
 * the visibility toggle.
 *
 * @example
 * <hlm-password-input id="password" [field]="loginForm.password" />
 */
@Component({
  selector: 'hlm-password-input',
  imports: [HlmInput, FormField, NgIcon],
  providers: [provideIcons({ lucideEye, lucideEyeOff })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative">
      <input
        hlmInput
        class="pr-10!"
        [id]="id()"
        [type]="visible() ? 'text' : 'password'"
        [placeholder]="placeholder()"
        [autocomplete]="autocomplete()"
        [formField]="field()"
        [forceInvalid]="forceInvalid()"
      />
      <button
        type="button"
        tabindex="-1"
        (click)="visible.set(!visible())"
        [attr.aria-label]="visible() ? 'Hide password' : 'Show password'"
        [attr.aria-pressed]="visible()"
        class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3 outline-none"
      >
        <ng-icon [name]="visible() ? 'lucideEyeOff' : 'lucideEye'" size="1rem" />
      </button>
    </div>
  `,
})
export class HlmPasswordInput {
  /** The Signal Forms field to bind (e.g. `loginForm.password`). */
  readonly field = input.required<FieldTree<string>>();
  readonly id = input<string>('');
  readonly placeholder = input<string>('');
  readonly autocomplete = input<string>('current-password');
  readonly forceInvalid = input(false, { transform: booleanAttribute });

  protected readonly visible = signal(false);
}
