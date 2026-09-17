import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  email,
  form,
  FormField,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCamera, lucideUser } from '@ng-icons/lucide';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import {
  newId,
  USER_ROLES,
  USER_STATUSES,
  type PatchUser,
  type PostUser,
  type PublicUser,
  type UserRole,
  type UserStatus,
} from '@tax-inspection/shared';
import { UsersService } from '../../../service/users.service';

interface UserFormModel {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
}

const emptyUser = (): UserFormModel => ({
  fullname: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'field_officer',
  status: 'active',
  avatar: '',
});

const titleCase = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

@Component({
  selector: 'app-user-form-sheet',
  imports: [
    FormField,
    NgIcon,
    BrnSheetContent,
    HlmSheetImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSelectImports,
  ],
  providers: [provideIcons({ lucideUser, lucideCamera })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form-sheet.html',
})
export class UserFormSheet {
  private readonly usersService = inject(UsersService);

  readonly saved = output<PublicUser>();

  protected readonly sheetState = signal<'open' | 'closed'>('closed');
  protected readonly editingId = signal<string | null>(null);
  protected readonly isEditing = computed(() => this.editingId() !== null);

  protected readonly roleOptions = USER_ROLES.map((r) => ({
    value: r,
    label: titleCase(r),
  }));
  protected readonly statusOptions = USER_STATUSES.map((s) => ({
    value: s,
    label: titleCase(s),
  }));

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fileError = signal<string | null>(null);

  protected readonly model = signal<UserFormModel>(emptyUser());

  protected readonly createForm = form(this.model, (path) => {
    required(path.fullname, { message: 'Full name is required.' });
    required(path.email, { message: 'Email is required.' });
    email(path.email, { message: 'Enter a valid email address.' });

    // Password required when creating; optional when editing (blank = keep current).
    validate(path.password, (ctx) => {
      const value = ctx.value();
      if (!this.isEditing() && !value) {
        return { kind: 'required', message: 'Password is required.' };
      }
      if (value && value.length < 8) {
        return {
          kind: 'minLength',
          message: 'Password must be at least 8 characters.',
        };
      }
      return undefined;
    });
    validate(path.confirmPassword, (ctx) => {
      const password = ctx.valueOf(path.password);
      if (password && ctx.value() !== password) {
        return { kind: 'passwordMismatch', message: 'Passwords do not match.' };
      }
      return undefined;
    });
  });

  protected readonly formatLabel = (value: string): string => titleCase(value);

  openForCreate(): void {
    this.reset();
    this.editingId.set(null);
    this.sheetState.set('open');
  }

  openForEdit(user: PublicUser): void {
    this.reset();
    this.editingId.set(user.id);
    this.model.set({
      fullname: user.fullname,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      status: user.status,
      avatar: user.avatar ?? '',
    });
    this.sheetState.set('open');
  }

  protected close(): void {
    this.sheetState.set('closed');
  }

  protected setRole(value: unknown): void {
    this.createForm.role().value.set(value as UserRole);
  }

  protected setStatus(value: unknown): void {
    this.createForm.status().value.set(value as UserStatus);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.fileError.set('Only JPG or PNG images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.fileError.set('Image must be under 2 MB.');
      return;
    }

    this.fileError.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      this.createForm.avatar().value.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  protected async onSubmit(): Promise<void> {
    const valid = await submit(this.createForm, async () => undefined);
    if (!valid) {
      return;
    }

    const { confirmPassword: _confirmPassword, ...values } = this.model();
    this.submitting.set(true);
    this.error.set(null);

    const id = this.editingId();
    const request$ = id
      ? this.usersService.update(id, this.toPatch(values))
      : this.usersService.create({ id: newId(), ...values } satisfies PostUser);

    request$.subscribe({
      next: (user) => {
        this.submitting.set(false);
        this.saved.emit(user);
        this.close();
        toast.success(id ? 'User updated successfully.' : 'User created successfully.');
      },
      error: (err) => {
        this.submitting.set(false);
        const message = err?.error?.error ?? 'Failed to save user.';
        this.error.set(message);
        toast.error(message);
      },
    });
  }

  /** Build a PATCH body; omit password when left blank (keep current). */
  private toPatch(values: Omit<UserFormModel, 'confirmPassword'>): PatchUser {
    const patch: PatchUser = {
      fullname: values.fullname,
      email: values.email,
      role: values.role,
      status: values.status,
      avatar: values.avatar,
    };
    if (values.password) {
      patch.password = values.password;
    }
    return patch;
  }

  protected reset(): void {
    this.model.set(emptyUser());
    this.createForm().reset();
    this.error.set(null);
    this.fileError.set(null);
    this.submitting.set(false);
  }

  protected onClosed(): void {
    this.sheetState.set('closed');
    this.reset();
  }
}
