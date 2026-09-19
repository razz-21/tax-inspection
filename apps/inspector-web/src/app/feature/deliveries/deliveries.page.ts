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
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { Dispatcher } from '@ngrx/signals/events';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBoxes,
  lucideGem,
  lucidePickaxe,
  lucideRefreshCw,
  lucideSearch,
  lucideWaves,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import type { MaterialType, TruckType } from '@tax-inspection/shared';
import { DeliveriesStore } from '../../store/deliveries/deliveries.store';
import { deliveriesPageEvents } from '../../store/deliveries/deliveries.events';

@Component({
  selector: 'app-deliveries-page',
  imports: [
    DatePipe,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmPaginationImports,
    HlmSkeletonImports,
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideRefreshCw,
      lucideWaves,
      lucidePickaxe,
      lucideGem,
      lucideBoxes,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deliveries.page.html',
})
export class DeliveriesPage implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  private readonly router = inject(Router);
  protected readonly store = inject(DeliveriesStore);
  protected readonly search = signal('');

  /** Placeholder rows rendered while the table is loading. */
  protected readonly skeletonRows = Array.from({ length: 6 });

  constructor() {
    // Debounce the search term and drive the store's query.
    toObservable(this.search)
      .pipe(skip(1), debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) =>
        this.dispatcher.dispatch(
          deliveriesPageEvents.queryChanged({ search: term, page: 1 }),
        ),
      );
  }

  ngOnInit(): void {
    this.dispatcher.dispatch(deliveriesPageEvents.opened());
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected reload(): void {
    this.dispatcher.dispatch(deliveriesPageEvents.reloaded());
  }

  protected openDetail(id: string): void {
    void this.router.navigate(['/main/deliveries', id]);
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
    this.dispatcher.dispatch(deliveriesPageEvents.queryChanged({ page: clamped }));
  }

  private readonly badgeBase =
    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium';

  protected truckBadge(type: TruckType): string {
    const colors: Record<string, string> = {
      '10 Wheelers':
        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      '8 Wheelers':
        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      '6 Wheelers':
        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    };
    return `${this.badgeBase} ${colors[type] ?? colors['6 Wheelers']}`;
  }

  protected readonly quantityBadge = `${this.badgeBase} bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`;

  protected readonly newBadge = `${this.badgeBase} bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800`;

  private readonly materialColors: Record<string, string> = {
    Sand: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    Gravel:
      'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    Stones:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    'Filling Materials':
      'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  };

  private readonly materialIcons: Record<string, string> = {
    Sand: 'lucideWaves',
    Gravel: 'lucidePickaxe',
    Stones: 'lucideGem',
    'Filling Materials': 'lucideBoxes',
  };

  protected materialBadge(type: MaterialType): string {
    return `${this.badgeBase} gap-1 ${this.materialColors[type] ?? this.materialColors['Stones']}`;
  }

  protected materialIcon(type: MaterialType): string {
    return this.materialIcons[type] ?? 'lucideBoxes';
  }

  /** Turns a role value (e.g. 'field_officer') into a display label. */
  protected roleLabel(role: string): string {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
