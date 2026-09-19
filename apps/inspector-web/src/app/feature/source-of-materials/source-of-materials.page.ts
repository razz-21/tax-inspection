import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dispatcher, Events } from '@ngrx/signals/events';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLayers,
  lucidePencil,
  lucidePlus,
  lucideRefreshCw,
  lucideTrash2,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import type {
  PostSourceOfMaterial,
  SourceOfMaterial,
} from '@tax-inspection/shared';
import { SourceOfMaterialsStore } from '../../store/source-of-materials/source-of-materials.store';
import {
  sourceOfMaterialsApiEvents,
  sourceOfMaterialsPageEvents,
} from '../../store/source-of-materials/source-of-materials.events';
import { ConfirmDialog } from '../delivery-details/confirm-dialog/confirm-dialog';
import { SourceOfMaterialDialog } from './source-of-material-dialog/source-of-material-dialog';

@Component({
  selector: 'app-source-of-materials-page',
  imports: [
    NgIcon,
    HlmButtonImports,
    HlmItemImports,
    HlmSkeletonImports,
    SourceOfMaterialDialog,
    ConfirmDialog,
  ],
  providers: [
    provideIcons({
      lucideLayers,
      lucidePencil,
      lucidePlus,
      lucideRefreshCw,
      lucideTrash2,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-of-materials.page.html',
})
export class SourceOfMaterialsPage implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly store = inject(SourceOfMaterialsStore);

  // Local UI state (dialog visibility + which record is being acted on).
  protected readonly dialogOpen = signal(false);
  protected readonly editing = signal<SourceOfMaterial | null>(null);
  protected readonly pendingDelete = signal<SourceOfMaterial | null>(null);

  /** Placeholder rows rendered while the list is loading. */
  protected readonly skeletonRows = Array.from({ length: 5 });

  constructor() {
    const events = inject(Events);

    // Close the form dialog + toast on a successful create/update.
    events
      .on(sourceOfMaterialsApiEvents.createdSuccess)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.dialogOpen.set(false);
        toast.success('Source of materials created.');
      });
    events
      .on(sourceOfMaterialsApiEvents.updatedSuccess)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.dialogOpen.set(false);
        toast.success('Source of materials updated.');
      });

    // Close the confirm dialog + toast on a successful delete.
    events
      .on(sourceOfMaterialsApiEvents.removedSuccess)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.pendingDelete.set(null);
        toast.success('Source of materials deleted.');
      });

    // Surface any failure (the dialog stays open so the user can retry).
    events
      .on(
        sourceOfMaterialsApiEvents.createdFailure,
        sourceOfMaterialsApiEvents.updatedFailure,
        sourceOfMaterialsApiEvents.removedFailure,
      )
      .pipe(takeUntilDestroyed())
      .subscribe((event) => toast.error(event.payload));
  }

  ngOnInit(): void {
    this.dispatcher.dispatch(sourceOfMaterialsPageEvents.opened());
  }

  protected reload(): void {
    this.dispatcher.dispatch(sourceOfMaterialsPageEvents.reloaded());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.dialogOpen.set(true);
  }

  protected openEdit(item: SourceOfMaterial): void {
    this.editing.set(item);
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
  }

  protected saveSource(body: PostSourceOfMaterial): void {
    const editing = this.editing();
    if (editing) {
      this.dispatcher.dispatch(
        sourceOfMaterialsPageEvents.updated({ id: editing.id, changes: body }),
      );
    } else {
      this.dispatcher.dispatch(sourceOfMaterialsPageEvents.created(body));
    }
  }

  protected requestDelete(item: SourceOfMaterial): void {
    this.pendingDelete.set(item);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const target = this.pendingDelete();
    if (target) {
      this.dispatcher.dispatch(sourceOfMaterialsPageEvents.removed(target.id));
    }
  }
}
