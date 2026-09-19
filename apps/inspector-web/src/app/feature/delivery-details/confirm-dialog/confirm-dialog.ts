import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';

/** Reusable destructive-action confirmation dialog. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [BrnAlertDialogContent, HlmAlertDialogImports, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-alert-dialog
      [state]="open() ? 'open' : 'closed'"
      (closed)="cancelled.emit()"
    >
      <hlm-alert-dialog-content *brnAlertDialogContent>
        <div hlmAlertDialogHeader>
          <h3 hlmAlertDialogTitle>{{ title() }}</h3>
          <p hlmAlertDialogDescription>{{ description() }}</p>
        </div>
        <div hlmAlertDialogFooter>
          <button
            hlmBtn
            variant="secondary"
            type="button"
            [disabled]="pending()"
            (click)="cancelled.emit()"
          >
            Cancel
          </button>
          <button
            hlmBtn
            variant="destructive"
            type="button"
            [disabled]="pending()"
            (click)="confirmed.emit()"
          >
            {{ pending() ? pendingLabel() : confirmLabel() }}
          </button>
        </div>
      </hlm-alert-dialog-content>
    </hlm-alert-dialog>
  `,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input('Are you sure?');
  readonly description = input('');
  readonly confirmLabel = input('Confirm');
  readonly pendingLabel = input('Working…');
  readonly pending = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
