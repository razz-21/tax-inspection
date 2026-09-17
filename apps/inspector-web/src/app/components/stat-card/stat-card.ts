import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';

/** Sharable presentational component: a labelled statistic in a spartan card. */
@Component({
  selector: 'app-stat-card',
  imports: [HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmCard class="p-4">
      <p class="text-sm text-muted-foreground">{{ label() }}</p>
      <p class="text-3xl font-bold">{{ value() }}</p>
    </div>
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
}
