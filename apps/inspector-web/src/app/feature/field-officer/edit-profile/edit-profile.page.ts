import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import type { PatchUser } from '@tax-inspection/shared';
import { UsersService } from '../../../service/users.service';
import { MeStore } from '../../../store/me/me.store';

interface EditProfileModel {
  fullname: string;
  contactNumber: string;
}

/** Field officer — edit profile (mobile): name + contact number. */
@Component({
  selector: 'app-edit-profile-page',
  imports: [
    RouterLink,
    NgIcon,
    FormField,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-profile.page.html',
})
export class EditProfilePage {
  private readonly router = inject(Router);
  private readonly users = inject(UsersService);
  protected readonly me = inject(MeStore);

  protected readonly submitting = signal(false);

  protected readonly model = signal<EditProfileModel>({
    fullname: this.me.user()?.fullname ?? '',
    contactNumber: this.me.user()?.contact_number ?? '',
  });

  protected readonly editForm = form(this.model, (path) => {
    required(path.fullname, { message: 'Full name is required.' });
    // Contact number is optional.
  });

  protected async onSubmit(): Promise<void> {
    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.editForm, async () => undefined);
    if (!valid) return;

    const userId = this.me.user()?.id;
    if (!userId) {
      toast.error('You are not signed in.');
      return;
    }

    const { fullname, contactNumber } = this.model();
    const patch: PatchUser = {
      fullname,
      contact_number: contactNumber,
    };

    this.submitting.set(true);
    try {
      const updated = await firstValueFrom(this.users.update(userId, patch));
      // Keep the session in sync so the profile reflects the change.
      this.me.updateUser(updated);
      toast.success('Profile updated.');
      await this.router.navigateByUrl('/field-officer/profile');
    } catch (err) {
      const message =
        (err as HttpErrorResponse)?.error?.error ?? 'Failed to update profile.';
      toast.error(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
