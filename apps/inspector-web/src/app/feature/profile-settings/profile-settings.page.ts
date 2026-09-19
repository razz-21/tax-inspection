import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  email,
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
  lucideBanknote,
  lucideCheck,
  lucideEye,
  lucideEyeOff,
  lucideLock,
  lucideMonitor,
  lucideMoon,
  lucidePalette,
  lucideSun,
  lucideUser,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import type { PatchUser, UserRole } from '@tax-inspection/shared';
import { AuthService } from '../../service/auth.service';
import { UsersService } from '../../service/users.service';
import { SettingsService } from '../../service/settings.service';
import { ThemeService, type Theme } from '../../service/theme.service';
import { MeStore } from '../../store/me/me.store';

interface AccountModel {
  fullname: string;
  email: string;
  contactNumber: string;
}

interface PasswordModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  field_officer: 'Field Officer',
};

/** 8+ chars with at least one upper and one lower case letter. */
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

@Component({
  selector: 'app-profile-settings-page',
  imports: [
    NgIcon,
    FormField,
    HlmAvatarImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmTabsImports,
  ],
  providers: [
    provideIcons({
      lucideUser,
      lucideBanknote,
      lucideLock,
      lucideEye,
      lucideEyeOff,
      lucideCheck,
      lucidePalette,
      lucideMonitor,
      lucideMoon,
      lucideSun,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-settings.page.html',
})
export class ProfileSettingsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly settings = inject(SettingsService);
  private readonly themeService = inject(ThemeService);
  protected readonly me = inject(MeStore);

  /** Current appearance preference (auto/dark/light). */
  protected readonly theme = this.themeService.theme;

  protected readonly roleLabel = computed(
    () => ROLE_LABELS[this.me.role() ?? 'field_officer'],
  );

  // --- Account details ---
  protected readonly savingAccount = signal(false);
  protected readonly accountModel = signal<AccountModel>(this.currentAccount());

  protected readonly accountForm = form(this.accountModel, (path) => {
    required(path.fullname, { message: 'Full name is required.' });
    required(path.email, { message: 'Email is required.' });
    email(path.email, { message: 'Enter a valid email address.' });
  });

  // --- Settings (tax rate) ---
  protected readonly savingTax = signal(false);
  /** Flat peso amount applied to each new delivery assessment. */
  protected readonly taxRate = signal<number | null>(null);

  // --- Change password ---
  protected readonly savingPassword = signal(false);
  protected readonly showCurrent = signal(false);
  protected readonly showNew = signal(false);
  protected readonly passwordModel = signal<PasswordModel>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  protected readonly passwordForm = form(this.passwordModel, (path) => {
    required(path.currentPassword, { message: 'Current password is required.' });
    required(path.newPassword, { message: 'New password is required.' });
    minLength(path.newPassword, 8, { message: 'Use at least 8 characters.' });
    pattern(path.newPassword, STRONG_PASSWORD, {
      message: 'Password does not meet the requirements.',
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

  private readonly newPassword = computed(
    () => this.passwordModel().newPassword,
  );
  protected readonly requirements = computed(() => {
    const p = this.newPassword();
    return [
      { label: 'At least 8 characters', met: p.length >= 8 },
      { label: 'Upper and lower case', met: /[a-z]/.test(p) && /[A-Z]/.test(p) },
    ];
  });
  protected readonly allRequirementsMet = computed(() =>
    this.requirements().every((r) => r.met),
  );

  ngOnInit(): void {
    void this.loadTaxRate();
  }

  private currentAccount(): AccountModel {
    const user = this.me.user();
    return {
      fullname: user?.fullname ?? '',
      email: user?.email ?? '',
      contactNumber: user?.contact_number ?? '',
    };
  }

  private async loadTaxRate(): Promise<void> {
    try {
      const { tax_rate } = await firstValueFrom(this.settings.get());
      this.taxRate.set(tax_rate);
    } catch {
      // Leave null; the field shows empty until settings load.
    }
  }

  // --- Account ---
  protected resetAccount(): void {
    this.accountModel.set(this.currentAccount());
    this.accountForm().reset();
  }

  protected async saveAccount(): Promise<void> {
    const valid = await submit(this.accountForm, async () => undefined);
    if (!valid) return;

    const userId = this.me.user()?.id;
    if (!userId) {
      toast.error('You are not signed in.');
      return;
    }

    const { fullname, email: emailValue, contactNumber } = this.accountModel();
    const patch: PatchUser = {
      fullname,
      email: emailValue,
      contact_number: contactNumber,
    };

    this.savingAccount.set(true);
    try {
      const updated = await firstValueFrom(this.users.update(userId, patch));
      this.me.updateUser(updated);
      toast.success('Account updated.');
    } catch (err) {
      toast.error(this.messageFor(err, 'Failed to update account.'));
    } finally {
      this.savingAccount.set(false);
    }
  }

  // --- Tax rate ---
  protected onTaxInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.taxRate.set(value === '' ? null : Number(value));
  }

  protected async saveTaxRate(): Promise<void> {
    const rate = this.taxRate();
    if (rate === null || rate < 0 || Number.isNaN(rate)) {
      toast.error('Enter a valid tax rate.');
      return;
    }
    this.savingTax.set(true);
    try {
      const res = await firstValueFrom(this.settings.update({ tax_rate: rate }));
      this.taxRate.set(res.tax_rate);
      toast.success('Tax rate saved.');
    } catch (err) {
      toast.error(this.messageFor(err, 'Failed to save tax rate.'));
    } finally {
      this.savingTax.set(false);
    }
  }

  // --- Password ---
  protected async updatePassword(): Promise<void> {
    const valid = await submit(this.passwordForm, async () => undefined);
    if (!valid) return;

    const { currentPassword, newPassword } = this.passwordModel();
    this.savingPassword.set(true);
    try {
      await firstValueFrom(
        this.users.changePassword({ currentPassword, newPassword }),
      );
      toast.success('Password updated.');
      this.passwordModel.set({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      this.passwordForm().reset();
    } catch (err) {
      toast.error(this.messageFor(err, 'Failed to update password.'));
    } finally {
      this.savingPassword.set(false);
    }
  }

  // --- Appearance ---
  protected setTheme(theme: string): void {
    this.themeService.set(theme as Theme);
  }

  // --- Profile card actions ---
  protected changePhoto(): void {
    toast.info('Photo upload is coming soon.');
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }

  private messageFor(err: unknown, fallback: string): string {
    return (err as HttpErrorResponse)?.error?.error ?? fallback;
  }
}
