import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';

/**
 * Titled card shell for a create-delivery section: a colored icon badge,
 * title + subtitle, an optional REQUIRED pill, a divider, then projected
 * content. Set the icon color via `iconClass`.
 *
 * When `collapsible` is set, the header acts as an accordion trigger that
 * expands/collapses the projected content.
 */
@Component({
  selector: 'app-section-card',
  imports: [NgIcon, HlmCardImports],
  providers: [provideIcons({ lucideChevronDown })],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard class="overflow-hidden">
      <div
        class="-mt-6 rounded-t-xl bg-gradient-to-b from-emerald-50 to-transparent !py-4"
        [class.border-b]="!collapsible() || expanded()"
        [class.cursor-pointer]="collapsible()"
        [class.select-none]="collapsible()"
        hlmCardHeader
        [attr.role]="collapsible() ? 'button' : null"
        [attr.tabindex]="collapsible() ? 0 : null"
        [attr.aria-expanded]="collapsible() ? expanded() : null"
        (click)="collapsible() && toggle()"
        (keydown.enter)="collapsible() && toggle()"
        (keydown.space)="onSpace($event)"
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

          @if (collapsible()) {
            <ng-icon
              name="lucideChevronDown"
              size="1.25rem"
              class="shrink-0 text-muted-foreground transition-transform duration-200"
              [class.rotate-180]="expanded()"
            />
          }
        </div>
      </div>

      @if (!collapsible() || expanded()) {
        <div hlmCardContent class="space-y-4">
          <ng-content />
        </div>
      }
    </section>
  `,
})
export class SectionCard {
  readonly icon = input.required<string>();
  readonly iconClass = input<string>('bg-emerald-600 text-white');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly required = input<boolean>(true);
  /** When true, the header toggles the projected content open/closed. */
  readonly collapsible = input<boolean>(false);
  /** Initial open state when `collapsible` is true. */
  readonly startExpanded = input<boolean>(true);

  /** Open state — only meaningful when `collapsible` is true. */
  protected readonly expanded = linkedSignal(() => this.startExpanded());

  protected toggle(): void {
    this.expanded.update((open) => !open);
  }

  protected onSpace(event: Event): void {
    if (!this.collapsible()) return;
    event.preventDefault();
    this.toggle();
  }
}
