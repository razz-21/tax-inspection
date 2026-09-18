import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  form,
  FormField,
  minLength,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCheck,
  lucideEye,
  lucideEyeOff,
  lucideInfo,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { UsersService } from '../../../service/users.service';
import { MeStore } from '../../../store/me/me.store';

interface ChangePasswordModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const emptyModel = (): ChangePasswordModel => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

/** Requires 8+ chars with at least one upper and one lower case letter. */
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

/** Field officer — change password (mobile). */
@Component({
  selector: 'app-change-password-page',
  imports: [
    RouterLink,
    NgIcon,
    FormField,
    HlmAlertImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideEye,
      lucideEyeOff,
      lucideCheck,
      lucideInfo,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password.page.html',
})
export class ChangePasswordPage {
  private readonly router = inject(Router);
  private readonly users = inject(UsersService);
  protected readonly me = inject(MeStore);

  protected readonly submitting = signal(false);
  protected readonly showCurrent = signal(false);
  protected readonly showNew = signal(false);

  protected readonly model = signal<ChangePasswordModel>(emptyModel());

  protected readonly changeForm = form(this.model, (path) => {
    required(path.currentPassword, {
      message: 'Current password is required.',
    });
    required(path.newPassword, { message: 'New password is required.' });
    minLength(path.newPassword, 8, {
      message: 'Use at least 8 characters.',
    });
    pattern(path.newPassword, STRONG_PASSWORD, {
      message: 'Include both upper and lower case letters.',
    });
    required(path.confirmPassword, {
      message: 'Please re-type your new password.',
    });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.newPassword)
        ? { kind: 'mismatch', message: 'Passwords do not match.' }
        : undefined,
    );
  });

  // --- Live requirement checks (drive the checklist) ---
  private readonly newPassword = computed(() => this.model().newPassword);
  protected readonly hasMinLength = computed(
    () => this.newPassword().length >= 8,
  );
  protected readonly hasCases = computed(
    () => /[a-z]/.test(this.newPassword()) && /[A-Z]/.test(this.newPassword()),
  );

  protected readonly requirements = computed(() => [
    { label: 'At least 8 characters', met: this.hasMinLength() },
    { label: 'Upper and lower case letters', met: this.hasCases() },
  ]);

  protected async onSubmit(): Promise<void> {
    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.changeForm, async () => undefined);
    if (!valid) return;

    const { currentPassword, newPassword } = this.model();
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.users.changePassword({ currentPassword, newPassword }),
      );
      toast.success('Password updated.');
      await this.router.navigateByUrl('/field-officer/profile');
    } catch (err) {
      const message =
        (err as HttpErrorResponse)?.error?.error ??
        'Failed to update password.';
      toast.error(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
