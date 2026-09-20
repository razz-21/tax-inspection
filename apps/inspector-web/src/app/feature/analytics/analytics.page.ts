import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Dispatcher } from '@ngrx/signals/events';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBanknote,
  lucideClock,
  lucideMapPin,
  lucidePercent,
  lucideRefreshCw,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import {
  HLM_CHART_THEME,
  HlmChartImports,
  hlmChartTooltip,
} from '@spartan-ng/helm/chart';
import { barX, barY, defineChart } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import {
  ANALYTICS_RANGE_LABELS,
  ANALYTICS_RANGES,
  type AnalyticsRange,
} from '@tax-inspection/shared';
import { AnalyticsStore } from '../../store/analytics/analytics.store';
import { analyticsPageEvents } from '../../store/analytics/analytics.events';

/** A single categorical bar. */
interface ChartRow {
  label: string;
  value: number;
  kind?: 'actual' | 'forecast';
}

type Fill = string | ((datum: ChartRow) => string);

interface BarChartConfig {
  fill: Fill;
  height: number;
  ariaLabel: string;
  /** Tooltip label for the category channel (replaces the raw "x"/"y"). */
  categoryLabel: string;
  /** Tooltip label for the value channel. */
  valueLabel: string;
  /** Optional value formatter for the tooltip, e.g. peso amounts. */
  valueText?: (value: number) => string;
  /** Minimum gap between category tick labels (vertical charts only). */
  minGap?: number;
}

const STATUS_COLORS: Record<string, string> = {
  Paid: '#10b981', // emerald-500
  Pending: '#f59e0b', // amber-500
  Hold: '#94a3b8', // slate-400
};

/** Peso amount, rounded, for compact tooltips. */
const peso = (value: number): string => `₱${Math.round(value).toLocaleString()}`;

@Component({
  selector: 'app-analytics-page',
  imports: [
    DecimalPipe,
    NgIcon,
    HlmButtonImports,
    HlmTooltipImports,
    HlmChartImports,
  ],
  providers: [
    provideIcons({
      lucidePercent,
      lucideBanknote,
      lucideClock,
      lucideMapPin,
      lucideRefreshCw,
      lucideTriangleAlert,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics.page.html',
})
export class AnalyticsPage implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly store = inject(AnalyticsStore);

  /** Filter options for the range selector. */
  protected readonly ranges = ANALYTICS_RANGES.map((value) => ({
    value,
    label: ANALYTICS_RANGE_LABELS[value],
  }));

  /** "This Year · Jan 1 – Sep 20" style subtitle. */
  protected readonly rangeSubtitle = computed(() => {
    const s = this.store.summary();
    if (!s) return '';
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    return `${ANALYTICS_RANGE_LABELS[s.range]} · ${fmt(s.start)} – ${fmt(s.end)}`;
  });

  /** Collection Rate Status — peso amount per payment status. */
  protected readonly collectionRateChart = computed(() => {
    const cr = this.store.summary()?.collectionRate;
    const rows: ChartRow[] = cr
      ? [
          { label: 'Paid', value: cr.paidAmount },
          { label: 'Pending', value: cr.pendingAmount },
          { label: 'Hold', value: cr.holdAmount },
        ]
      : [];
    return this.horizontalBars(rows, {
      fill: (d) => STATUS_COLORS[d.label] ?? '#94a3b8',
      height: 150,
      ariaLabel: 'Amount by payment status',
      categoryLabel: 'Status',
      valueLabel: 'Amount',
      valueText: peso,
    });
  });

  /** Collection Efficiency Index — count of settled penalties per lag bucket. */
  protected readonly ceiChart = computed(() => {
    const rows: ChartRow[] = (
      this.store.summary()?.collectionEfficiency.distribution ?? []
    ).map((b) => ({ label: b.label, value: b.count }));
    return this.verticalBars(rows, {
      fill: '#6366f1',
      height: 200,
      ariaLabel: 'Collection lag distribution',
      categoryLabel: 'Lag',
      valueLabel: 'Penalties',
      minGap: 8,
    });
  });

  /** Logistical bottlenecks — deliveries by hour of day (peak windows). */
  protected readonly hourlyChart = computed(() => {
    const rows: ChartRow[] = (
      this.store.summary()?.bottlenecks.hourly ?? []
    ).map((h) => ({ label: h.label, value: h.deliveries }));
    return this.verticalBars(rows, {
      fill: '#f59e0b',
      height: 220,
      ariaLabel: 'Deliveries by hour of day',
      categoryLabel: 'Hour',
      valueLabel: 'Deliveries',
      minGap: 20,
    });
  });

  /** Logistical bottlenecks — deliveries by weekday. */
  protected readonly weekdayChart = computed(() => {
    const rows: ChartRow[] = (
      this.store.summary()?.bottlenecks.byWeekday ?? []
    ).map((w) => ({ label: w.label, value: w.deliveries }));
    return this.verticalBars(rows, {
      fill: '#f59e0b',
      height: 170,
      ariaLabel: 'Deliveries by weekday',
      categoryLabel: 'Weekday',
      valueLabel: 'Deliveries',
      minGap: 8,
    });
  });

  /** High-traffic drop-off zones — deliveries per destination. */
  protected readonly destinationsChart = computed(() => {
    const dests = this.store.summary()?.bottlenecks.topDestinations ?? [];
    const rows: ChartRow[] = dests.map((d) => ({
      label: d.place,
      value: d.deliveries,
    }));
    return this.horizontalBars(rows, {
      fill: '#0ea5e9',
      height: Math.max(140, rows.length * 34),
      ariaLabel: 'Deliveries by destination',
      categoryLabel: 'Destination',
      valueLabel: 'Deliveries',
    });
  });

  /** Tax revenue trend — actual (solid) + forecast (light) monthly revenue. */
  protected readonly revenueChart = computed(() => {
    const rows: ChartRow[] = (
      this.store.summary()?.revenueTrend.points ?? []
    ).map((p) => ({ label: p.label, value: p.revenue, kind: p.kind }));
    return this.verticalBars(rows, {
      fill: (d) => (d.kind === 'forecast' ? '#c4b5fd' : '#8b5cf6'),
      height: 240,
      ariaLabel: 'Monthly revenue trend and forecast',
      categoryLabel: 'Month',
      valueLabel: 'Revenue',
      valueText: peso,
      minGap: 8,
    });
  });

  ngOnInit(): void {
    this.dispatcher.dispatch(analyticsPageEvents.opened());
  }

  protected setRange(range: AnalyticsRange): void {
    if (range === this.store.range()) return;
    this.dispatcher.dispatch(analyticsPageEvents.rangeChanged(range));
  }

  protected reload(): void {
    this.dispatcher.dispatch(analyticsPageEvents.reloaded());
  }

  /** Readable tooltip: category + value rows instead of raw "x"/"y". */
  private tooltip(
    categoryChannel: 'x' | 'y',
    valueChannel: 'x' | 'y',
    config: BarChartConfig,
  ) {
    return hlmChartTooltip<ChartRow>({
      items: [
        { channel: categoryChannel, label: config.categoryLabel },
        {
          channel: valueChannel,
          label: config.valueLabel,
          ...(config.valueText
            ? { text: (point) => config.valueText!(point.datum.value) }
            : {}),
        },
      ],
    });
  }

  /** Vertical bar chart (category on x, value on y). */
  private verticalBars(rows: ChartRow[], config: BarChartConfig) {
    return {
      definition: defineChart(
        {
          marks: [
            barY(rows, {
              x: 'label',
              y: 'value',
              key: 'label',
              fill: config.fill,
              radius: 4,
            }),
          ],
          scales: {
            x: {
              scale: () => scaleBand<string>().paddingInner(0.3).paddingOuter(0.1),
              axis: {
                line: false,
                ticks: { size: 0, padding: 8 },
                tickLabels: { thin: { minGap: config.minGap ?? 16 } },
              },
            },
            y: { scale: scaleLinear, grid: true, axis: false },
          },
          theme: HLM_CHART_THEME,
        },
        { focus: 'group-x', tooltip: this.tooltip('x', 'y', config) },
      ),
      ariaLabel: config.ariaLabel,
      height: config.height,
    };
  }

  /** Horizontal bar chart (category on y, value on x). */
  private horizontalBars(rows: ChartRow[], config: BarChartConfig) {
    return {
      definition: defineChart(
        {
          marks: [
            barX(rows, {
              x: 'value',
              y: 'label',
              key: 'label',
              fill: config.fill,
              radius: 4,
            }),
          ],
          scales: {
            x: { scale: scaleLinear, grid: true, axis: false },
            y: {
              scale: () => scaleBand<string>().paddingInner(0.35).paddingOuter(0.15),
              axis: { line: false, ticks: { size: 0, padding: 8 } },
            },
          },
          theme: HLM_CHART_THEME,
        },
        { focus: 'group-y', tooltip: this.tooltip('y', 'x', config) },
      ),
      ariaLabel: config.ariaLabel,
      height: config.height,
    };
  }
}
