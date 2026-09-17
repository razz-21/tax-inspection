import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { Dispatcher, Events } from '@ngrx/signals/events';
import { toast } from '@spartan-ng/brain/sonner';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideSearch,
  lucideSquarePen,
  lucideTrash2,
} from '@ng-icons/lucide';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import type { PublicUser, UserStatus } from '@tax-inspection/shared';
import { UsersStore } from '../../store/users/users.store';
import {
  usersApiEvents,
  usersPageEvents,
} from '../../store/users/users.events';
import { UserFormSheet } from './user-form-sheet/user-form-sheet';

@Component({
  selector: 'app-user-management-page',
  imports: [
    DatePipe,
    NgIcon,
    BrnAlertDialogContent,
    HlmAlertDialogImports,
    HlmAvatarImports,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmPaginationImports,
    UserFormSheet,
  ],
  providers: [
    provideIcons({ lucideSearch, lucidePlus, lucideSquarePen, lucideTrash2 }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-management.page.html',
})
export class UserManagementPage implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly store = inject(UsersStore);
  protected readonly search = signal('');

  constructor() {
    const events = inject(Events);

    // Debounce the search term and drive the store's query.
    toObservable(this.search)
      .pipe(skip(1), debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) =>
        this.dispatcher.dispatch(
          usersPageEvents.queryChanged({ search: term, page: 1 }),
        ),
      );

    // Toast on delete result (delete runs through the store).
    events
      .on(usersApiEvents.removedSuccess)
      .pipe(takeUntilDestroyed())
      .subscribe(() => toast.success('User deleted successfully.'));
    events
      .on(usersApiEvents.removedFailure)
      .pipe(takeUntilDestroyed())
      .subscribe((event) => toast.error(event.payload));
  }

  ngOnInit(): void {
    this.dispatcher.dispatch(usersPageEvents.opened());
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  /** Page numbers (with '...') to display, based on the current meta. */
  protected readonly pages = computed<(number | '...')[]>(() => {
    const meta = this.store.meta();
    if (!meta) {
      return [];
    }
    const total = meta.totalPages;
    const current = meta.page;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const result: (number | '...')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) {
      result.push('...');
    }
    for (let p = start; p <= end; p++) {
      result.push(p);
    }
    if (end < total - 1) {
      result.push('...');
    }
    result.push(total);
    return result;
  });

  protected goToPage(page: number | '...'): void {
    const meta = this.store.meta();
    if (!meta || page === '...') {
      return;
    }
    const clamped = Math.min(Math.max(1, page), meta.totalPages);
    if (clamped === meta.page) {
      return;
    }
    this.dispatcher.dispatch(usersPageEvents.queryChanged({ page: clamped }));
  }

  /** Turns an enum value (e.g. 'needs_approval') into a display label. */
  protected label(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private readonly badgeBase =
    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium';

  protected roleBadge(role: string): string {
    const colors: Record<string, string> = {
      super_admin:
        'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      admin:
        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      field_officer:
        'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    };
    return `${this.badgeBase} ${colors[role] ?? colors['field_officer']}`;
  }

  protected statusBadge(status: UserStatus): string {
    const colors: Record<UserStatus, string> = {
      active:
        'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      inactive:
        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      needs_approval:
        'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    };
    return `${this.badgeBase} ${colors[status] ?? colors['inactive']}`;
  }

  protected onSaved(_user: PublicUser): void {
    this.dispatcher.dispatch(usersPageEvents.reloaded());
  }

  /** The user pending deletion (drives the confirmation alert dialog). */
  protected readonly pendingDelete = signal<PublicUser | null>(null);

  protected deleteConfirmed(): void {
    const user = this.pendingDelete();
    if (user) {
      this.dispatcher.dispatch(usersPageEvents.removed(user.id));
    }
    this.pendingDelete.set(null);
  }
}
