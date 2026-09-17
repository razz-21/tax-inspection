import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-dashboard-page',
  imports: [HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p class="text-muted-foreground text-sm">
          Overview of tax inspection activity.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (stat of stats; track stat.label) {
          <div hlmCard class="p-4">
            <p class="text-muted-foreground text-sm">{{ stat.label }}</p>
            <p class="text-3xl font-bold">{{ stat.value }}</p>
          </div>
        }
      </div>

      <div hlmCard>
        <div hlmCardHeader>
          <h3 hlmCardTitle>Welcome back</h3>
          <p hlmCardDescription>
            Use the sidebar to navigate between inspections and user management.
          </p>
        </div>
        <div hlmCardContent>
          <p class="text-muted-foreground text-sm">
            This is the main dashboard content area.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPage {
  protected readonly stats = [
    { label: 'Open inspections', value: 12 },
    { label: 'Flagged', value: 3 },
    { label: 'Completed (30d)', value: 47 },
    { label: 'Taxpayers', value: 128 },
  ];
}
