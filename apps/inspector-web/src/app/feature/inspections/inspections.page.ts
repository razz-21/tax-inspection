import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { injectDispatch } from '@ngrx/signals/events';
import { formatCurrency, INSPECTION_STATUS_LABELS } from '@tax-inspection/shared';
import { StatCard } from '../../components/stat-card/stat-card';
import { InspectionsStore } from '../../store/inspections.store';
import { inspectionsPageEvents } from '../../store/inspections.events';

@Component({
  selector: 'app-inspections-page',
  imports: [HlmButtonImports, HlmCardImports, StatCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inspections.page.html',
})
export class InspectionsPage implements OnInit {
  protected readonly store = inject(InspectionsStore);
  protected readonly dispatch = injectDispatch(inspectionsPageEvents);
  protected readonly statusLabels = INSPECTION_STATUS_LABELS;
  protected readonly formatCurrency = formatCurrency;

  ngOnInit(): void {
    this.dispatch.opened();
  }
}
