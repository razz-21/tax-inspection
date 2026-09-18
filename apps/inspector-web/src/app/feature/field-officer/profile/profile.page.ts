import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLogOut } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../service/auth.service';
import { MeStore } from '../../../store/me/me.store';

/** Field officer's profile (mobile): account details + logout. */
@Component({
  selector: 'app-profile-page',
  imports: [NgIcon, HlmAvatarImports, HlmButtonImports],
  providers: [provideIcons({ lucideLogOut })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4"
    >
      <h1 class="text-lg font-semibold">Profile</h1>
    </header>

    <section class="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <hlm-avatar class="size-20">
        @if (me.avatar()) {
          <img hlmAvatarImage [src]="me.avatar()" [alt]="me.fullname()" />
        }
        <span hlmAvatarFallback class="text-xl">{{ me.initials() }}</span>
      </hlm-avatar>

      <div>
        <p class="text-lg font-semibold">{{ me.fullname() }}</p>
        <p class="text-sm text-muted-foreground">{{ me.email() }}</p>
      </div>

      @if (roleLabel()) {
        <span
          class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          {{ roleLabel() }}
        </span>
      }
    </section>

    <div class="px-4">
      <button hlmBtn variant="outline" class="w-full" (click)="logout()">
        <ng-icon name="lucideLogOut" size="1rem" class="mr-2" />
        Log out
      </button>
    </div>
  `,
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly me = inject(MeStore);

  /** Humanized role, e.g. `field_officer` → "Field Officer". */
  protected readonly roleLabel = computed(() => {
    const role = this.me.role();
    if (!role) return '';
    return role
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  });

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
