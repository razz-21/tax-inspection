import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGalleryVerticalEnd } from '@ng-icons/lucide';
import type { LoginErrorResponse } from '@tax-inspection/shared';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { AuthService } from '../../service/auth.service';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-page',
  imports: [
    NgIcon,
    FormField,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  providers: [provideIcons({ lucideGalleryVerticalEnd })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly model = signal<LoginModel>({ email: '', password: '' });

  /** True while the login request is in flight. */
  protected readonly submitting = signal(false);
  /** Server-side rejection message (bad credentials or account status). */
  protected readonly serverError = signal<string | null>(null);

  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Email is required.' });
    email(path.email, { message: 'Enter a valid email address.' });
    required(path.password, { message: 'Password is required.' });
  });

  protected async onSubmit(): Promise<void> {
    this.serverError.set(null);

    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.loginForm, async () => undefined);
    if (!valid) return;

    this.submitting.set(true);
    try {
      await firstValueFrom(this.auth.login(this.model()));
      await this.router.navigateByUrl('/main');
    } catch (err) {
      this.serverError.set(this.messageFor(err));
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Prefer the API's message (which explains inactive / needs-approval
   * accounts and invalid credentials), falling back for network errors.
   */
  private messageFor(err: unknown): string {
    const body = (err as HttpErrorResponse)?.error as
      | LoginErrorResponse
      | undefined;
    if (body && typeof body === 'object' && typeof body.error === 'string') {
      return body.error;
    }
    return 'Unable to sign in right now. Please try again.';
  }
}
