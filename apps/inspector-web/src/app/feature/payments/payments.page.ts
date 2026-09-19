import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Dispatcher } from '@ngrx/signals/events';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import {
  PAYMENT_RANGE_LABELS,
  PAYMENT_RANGES,
  PAYMENT_STATUSES,
  type PaymentRange,
  type PaymentStatus,
} from '@tax-inspection/shared';
import { PaymentsStore } from '../../store/payments/payments.store';
import { paymentsPageEvents } from '../../store/payments/payments.events';

@Component({
  selector: 'app-payments-page',
  imports: [
    DatePipe,
    DecimalPipe,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmPaginationImports,
    HlmSelectImports,
    HlmSkeletonImports,
  ],
  providers: [provideIcons({ lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payments.page.html',
})
export class PaymentsPage implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly store = inject(PaymentsStore);

  protected readonly statuses = PAYMENT_STATUSES;
  /** Currently active status filter, or 'all'. */
  protected readonly activeStatus = signal<PaymentStatus | 'all'>('all');

  /** Date-range filter options + current selection ('all' = no range). */
  protected readonly ranges = PAYMENT_RANGES.map((value) => ({
    value,
    label: PAYMENT_RANGE_LABELS[value],
  }));
  protected readonly activeRange = signal<PaymentRange | 'all'>('this_week');

  /** Labels shown in the (closed) dropdown triggers. */
  protected readonly statusLabel = computed(() =>
    this.activeStatus() === 'all' ? 'All statuses' : this.activeStatus(),
  );
  protected readonly rangeLabel = computed(() => {
    const r = this.activeRange();
    return r === 'all' ? 'All dates' : PAYMENT_RANGE_LABELS[r];
  });

  /** Placeholder rows rendered while the table is loading. */
  protected readonly skeletonRows = Array.from({ length: 6 });

  ngOnInit(): void {
    this.dispatcher.dispatch(paymentsPageEvents.opened());
  }

  protected filterByRange(range: PaymentRange | 'all'): void {
    this.activeRange.set(range);
    this.dispatcher.dispatch(
      paymentsPageEvents.queryChanged({
        range: range === 'all' ? undefined : range,
        page: 1,
      }),
    );
  }

  protected filterByStatus(status: PaymentStatus | 'all'): void {
    this.activeStatus.set(status);
    this.dispatcher.dispatch(
      paymentsPageEvents.queryChanged({
        payment_status: status === 'all' ? undefined : status,
        page: 1,
      }),
    );
  }

  protected reload(): void {
    this.dispatcher.dispatch(paymentsPageEvents.reloaded());
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
    this.dispatcher.dispatch(paymentsPageEvents.queryChanged({ page: clamped }));
  }

  protected paymentStatusBadge(status: PaymentStatus): string {
    const base =
      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium';
    const colors: Record<PaymentStatus, string> = {
      Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      Pending:
        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      Hold: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };
    return `${base} ${colors[status]}`;
  }
}
