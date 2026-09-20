import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCloudOff,
  lucidePackage,
  lucidePlus,
  lucideTrash2,
  lucideUpload,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Dispatcher } from '@ngrx/signals/events';
import { DeliveriesService } from '../../../service/deliveries.service';
import { DraftDeliveriesService } from '../../../service/draft-deliveries.service';
import { NetworkService } from '../../../service/network.service';
import { fieldOfficerDeliveriesPageEvents } from '../../../store/field-officer-deliveries/field-officer-deliveries.events';

/**
 * Draft deliveries captured offline. Field officers create drafts here (saved to
 * local storage), then submit them all to the API once a connection is back.
 */
@Component({
  selector: 'app-draft-deliveries-page',
  imports: [RouterLink, NgIcon, HlmButtonImports],
  providers: [
    provideIcons({
      lucidePlus,
      lucidePackage,
      lucideTrash2,
      lucideUpload,
      lucideCloudOff,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './draft-devlieries.page.html',
})
export class DraftDeliveriesPage {
  private readonly draftService = inject(DraftDeliveriesService);
  private readonly deliveries = inject(DeliveriesService);
  private readonly network = inject(NetworkService);
  private readonly dispatcher = inject(Dispatcher);
  private readonly router = inject(Router);

  protected readonly drafts = this.draftService.drafts;
  protected readonly count = this.draftService.count;
  protected readonly online = this.network.online;
  protected readonly submitting = signal(false);

  protected remove(id: string): void {
    this.draftService.remove(id);
    toast.success('Draft removed.');
  }

  /** Submit every draft to the API; keep any that fail as drafts. */
  protected async submitAll(): Promise<void> {
    if (!this.online()) {
      toast.error('No connection — connect to submit your drafts.');
      return;
    }
    const drafts = this.drafts();
    if (drafts.length === 0) return;

    this.submitting.set(true);
    let submitted = 0;
    let failed = 0;
    for (const draft of drafts) {
      try {
        const created = await firstValueFrom(
          this.deliveries.create(draft.payload),
        );
        // Keep the field officer's cached delivery list in sync.
        this.dispatcher.dispatch(
          fieldOfficerDeliveriesPageEvents.created(created),
        );
        this.draftService.remove(draft.id);
        submitted++;
      } catch {
        failed++;
      }
    }
    this.submitting.set(false);

    if (failed === 0) {
      toast.success(
        `Submitted ${submitted} draft ${submitted === 1 ? 'delivery' : 'deliveries'}.`,
      );
      await this.router.navigateByUrl('/field-officer/deliveries');
    } else {
      toast.error(
        `${submitted} submitted, ${failed} failed. Failed drafts were kept.`,
      );
    }
  }
}
