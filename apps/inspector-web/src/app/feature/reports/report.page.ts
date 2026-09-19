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
import { lucideDownload, lucideRefreshCw } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ReportsStore } from '../../store/reports/reports.store';
import { reportsPageEvents } from '../../store/reports/reports.events';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-reports-page',
  imports: [
    DecimalPipe,
    NgIcon,
    HlmButtonImports,
    HlmSelectImports,
    HlmSkeletonImports,
  ],
  providers: [provideIcons({ lucideDownload, lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.page.html',
})
export class ReportsPage implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly store = inject(ReportsStore);

  protected readonly months = MONTHS.map((label, i) => ({
    value: i + 1,
    label,
  }));
  /** Current year back to five years ago. */
  protected readonly years = Array.from(
    { length: 6 },
    (_, i) => new Date().getFullYear() - i,
  );

  protected readonly monthLabel = computed(
    () => MONTHS[this.store.filter().month - 1],
  );
  protected readonly periodLabel = computed(
    () => `${this.monthLabel()} ${this.store.filter().year}`,
  );

  protected readonly skeletonRows = Array.from({ length: 8 });

  ngOnInit(): void {
    this.dispatcher.dispatch(reportsPageEvents.opened());
  }

  protected setMonth(month: unknown): void {
    this.dispatcher.dispatch(
      reportsPageEvents.filterChanged({
        month: Number(month),
        year: this.store.filter().year,
      }),
    );
  }

  protected setYear(year: unknown): void {
    this.dispatcher.dispatch(
      reportsPageEvents.filterChanged({
        month: this.store.filter().month,
        year: Number(year),
      }),
    );
  }

  protected reload(): void {
    this.dispatcher.dispatch(reportsPageEvents.reloaded());
  }

  /** Download the current report rows as a CSV file. */
  protected exportCsv(): void {
    const rows = this.store.rows();
    if (!rows.length) return;

    const headers = [
      'Name of the Hauler',
      'Truck Plate No.',
      'Address',
      'Time',
      'Source of Material',
      'Kind of Material',
      'Quantity',
      'Place of Delivery',
      'Delivery Receipt Number',
      'Remarks',
    ];
    const escape = (value: string | number): string => {
      const s = String(value ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.hauler_name,
          r.truck_plate,
          r.address,
          r.time,
          r.source_of_material,
          r.material_type,
          r.quantity,
          r.place_of_delivery,
          r.receipt_number,
          r.remarks,
        ]
          .map(escape)
          .join(','),
      ),
    ];

    // Prefix a BOM so Excel reads the UTF-8 content correctly.
    const blob = new Blob(['﻿' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const { month, year } = this.store.filter();
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tax-inspection-report-${year}-${String(month).padStart(2, '0')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
