import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmCardImports } from '@spartan-ng/helm/card';

/**
 * Titled card shell for a create-delivery section: a colored icon badge,
 * title + subtitle, an optional REQUIRED pill, a divider, then projected
 * content. Set the icon color via `iconClass`.
 */
@Component({
  selector: 'app-section-card',
  imports: [NgIcon, HlmCardImports],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard class="overflow-hidden">
      <div
        class="-mt-6 rounded-t-xl border-b bg-gradient-to-b from-emerald-50 to-transparent !py-4"
        hlmCardHeader
      >
        <div class="flex items-center gap-3">
          <span
            class="flex size-11 shrink-0 items-center justify-center rounded-xl"
            [class]="iconClass()"
          >
            <ng-icon [name]="icon()" size="1.375rem" />
          </span>

          <div class="min-w-0 flex-1">
            <h2 hlmCardTitle class="text-base font-semibold leading-tight">
              {{ title() }}
            </h2>
            @if (subtitle()) {
              <p class="text-sm text-muted-foreground">{{ subtitle() }}</p>
            }
          </div>

          @if (required()) {
            <span
              class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
            >
              Required
            </span>
          }
        </div>
      </div>

      <div hlmCardContent class="space-y-4">
        <ng-content />
      </div>
    </section>
  `,
})
export class SectionCard {
  readonly icon = input.required<string>();
  readonly iconClass = input<string>('bg-emerald-600 text-white');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly required = input<boolean>(true);
}
