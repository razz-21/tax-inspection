import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideLock,
  lucideLogOut,
  lucidePencil,
  lucideShield,
  lucideUser,
} from '@ng-icons/lucide';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../service/auth.service';
import { MeStore } from '../../../store/me/me.store';

/** Field officer's profile (mobile): identity, account details, actions. */
@Component({
  selector: 'app-profile-page',
  imports: [
    NgIcon,
    BrnAlertDialogContent,
    HlmAlertDialogImports,
    HlmAvatarImports,
    HlmButtonImports,
  ],
  providers: [
    provideIcons({
      lucideShield,
      lucideUser,
      lucideLock,
      lucideChevronRight,
      lucidePencil,
      lucideLogOut,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.page.html',
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly me = inject(MeStore);

  /** Drives the "log out?" confirmation dialog. */
  protected readonly confirmLogout = signal(false);

  /** Humanized role, e.g. `field_officer` → "Field Officer". */
  protected readonly roleLabel = computed(() => {
    const role = this.me.role();
    if (!role) return '';
    return role
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  });

  /** Contact number if present on the user record, otherwise a dash. */
  protected readonly contactNumber = computed(
    () => this.me.user()?.contact_number || '—',
  );

  protected changePassword(): void {
    void this.router.navigateByUrl('/field-officer/profile/change-password');
  }

  protected editProfile(): void {
    void this.router.navigateByUrl('/field-officer/profile/edit');
  }

  protected confirmLogoutAndSignOut(): void {
    this.confirmLogout.set(false);
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
