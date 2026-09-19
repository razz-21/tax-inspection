import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideFlag,
  lucideMountain,
  lucideRefreshCw,
  lucideTruck,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import {
  HLM_CHART_THEME,
  HlmChartImports,
  hlmChartTooltip,
} from '@spartan-ng/helm/chart';
import { barY, defineChart } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import {
  DASHBOARD_RANGE_LABELS,
  DASHBOARD_RANGES,
  type DashboardRange,
} from '@tax-inspection/shared';
import { MeStore } from '../../store/me/me.store';
import { DashboardStore } from '../../store/dashboard/dashboard.store';
import { dashboardPageEvents } from '../../store/dashboard/dashboard.events';

const MATERIAL_BAR_COLORS = [
  'bg-amber-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-rose-500',
];

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DecimalPipe,
    RouterLink,
    NgIcon,
    HlmButtonImports,
    HlmTooltipImports,
    HlmChartImports,
  ],
  providers: [
    provideIcons({
      lucideTruck,
      lucideMountain,
      lucideCheck,
      lucideFlag,
      lucideRefreshCw,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  private readonly me = inject(MeStore);
  protected readonly store = inject(DashboardStore);

  /** Filter options for the range selector. */
  protected readonly ranges = DASHBOARD_RANGES.map((value) => ({
    value,
    label: DASHBOARD_RANGE_LABELS[value],
  }));

  /** Time-of-day greeting with the user's first name. */
  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const part =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const first = this.me.fullname().split(' ')[0] || 'there';
    return `${part}, ${first}`;
  });

  protected readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /** "This week · Sep 14 – Sep 20" style subtitle for the chart. */
  protected readonly rangeSubtitle = computed(() => {
    const s = this.store.summary();
    if (!s) return '';
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    return `${DASHBOARD_RANGE_LABELS[s.range]} · ${fmt(s.start)} – ${fmt(s.end)}`;
  });

  /** Deliveries-per-day bar chart (bucketed by delivery date). */
  protected readonly chartOptions = computed(() => {
    const rows = (this.store.summary()?.perDay ?? []).map((d) => ({
      label: d.label,
      value: d.deliveries,
    }));
    return {
      definition: defineChart(
        {
          marks: [
            barY(rows, {
              x: 'label',
              y: 'value',
              key: 'label',
              fill: '#6366f1',
            }),
          ],
          scales: {
            x: {
              scale: () => scaleBand<string>().paddingInner(0.3).paddingOuter(0.1),
              axis: {
                line: false,
                ticks: { size: 0, padding: 8 },
                tickLabels: { thin: { minGap: 24 } },
              },
            },
            y: { scale: scaleLinear, grid: true, axis: false },
          },
          theme: HLM_CHART_THEME,
        },
        { focus: 'group-x', tooltip: hlmChartTooltip() },
      ),
      ariaLabel: 'Deliveries per day',
      height: 240,
    };
  });

  ngOnInit(): void {
    this.dispatcher.dispatch(dashboardPageEvents.opened());
  }

  protected setRange(range: DashboardRange): void {
    if (range === this.store.range()) return;
    this.dispatcher.dispatch(dashboardPageEvents.rangeChanged(range));
  }

  protected reload(): void {
    this.dispatcher.dispatch(dashboardPageEvents.reloaded());
  }

  protected materialColor(index: number): string {
    return MATERIAL_BAR_COLORS[index % MATERIAL_BAR_COLORS.length];
  }

  protected statusBadge(status: 'passed' | 'flagged' | 'pending'): string {
    const base =
      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize';
    const tones: Record<string, string> = {
      passed:
        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      flagged:
        'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
      pending:
        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };
    return `${base} ${tones[status]}`;
  }
}
