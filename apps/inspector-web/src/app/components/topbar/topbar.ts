import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideLogOut,
  lucideSettings,
} from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { AuthService } from '../../service/auth.service';
import { MeStore } from '../../store/me/me.store';

/**
 * Application header: sidebar trigger + title on the left, and the signed-in
 * user's avatar/name with a logout dropdown on the right.
 */
@Component({
  selector: 'app-topbar',
  imports: [
    NgIcon,
    HlmAvatarImports,
    HlmButtonImports,
    HlmSidebarImports,
  ],
  providers: [
    provideIcons({ lucideChevronDown, lucideLogOut, lucideSettings }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex h-16 items-center gap-2 border-b px-4 bg-background">
      <button hlmSidebarTrigger></button>
      <span class="text-sm font-medium">Tax Inspection</span>

      <!-- User menu -->
      <div class="relative ml-auto">
        <button
          type="button"
          class="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-accent"
          [attr.aria-expanded]="open()"
          aria-haspopup="menu"
          (click)="toggle()"
        >
          <hlm-avatar class="size-8">
            @if (me.avatar()) {
              <img hlmAvatarImage [src]="me.avatar()" [alt]="me.fullname()" />
            }
            <span hlmAvatarFallback class="text-xs">{{ me.initials() }}</span>
          </hlm-avatar>
          <span class="hidden text-sm font-medium sm:inline">
            {{ me.fullname() }}
          </span>
          <ng-icon name="lucideChevronDown" size="1rem" class="text-muted-foreground" />
        </button>

        @if (open()) {
          <!-- Click-outside backdrop -->
          <button
            type="button"
            class="fixed inset-0 z-40 cursor-default"
            tabindex="-1"
            aria-hidden="true"
            (click)="close()"
          ></button>

          <div
            role="menu"
            class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
          >
            <div class="border-b px-3 py-2">
              <p class="truncate text-sm font-medium">{{ me.fullname() }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ me.email() }}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              (click)="goToProfile()"
            >
              <ng-icon name="lucideSettings" size="1rem" />
              Profile &amp; Settings
            </button>
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm hover:bg-accent"
              (click)="logout()"
            >
              <ng-icon name="lucideLogOut" size="1rem" />
              Log out
            </button>
          </div>
        }
      </div>
    </header>
  `,
})
export class Topbar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly me = inject(MeStore);

  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected goToProfile(): void {
    this.close();
    void this.router.navigateByUrl('/main/profile-settings');
  }

  protected logout(): void {
    this.close();
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
