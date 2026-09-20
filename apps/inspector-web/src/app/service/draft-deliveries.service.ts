import { computed, effect, inject, Injectable, signal } from '@angular/core';
import type { PostDelivery } from '@tax-inspection/shared';
import { MeStore } from '../store/me/me.store';

/** A delivery captured offline and stored locally until it can be submitted. */
export interface DraftDelivery {
  /** Client-generated id (not the server id). */
  id: string;
  payload: PostDelivery;
  /** ISO timestamp of when the draft was saved. */
  createdAt: string;
}

const KEY_PREFIX = 'draft-deliveries';

/**
 * Persists draft deliveries in `localStorage`, scoped per signed-in user so a
 * shared device never mixes drafts between officers. Drafts survive reloads and
 * logout/login (the field officer's unsent work is never silently dropped) and
 * are removed once successfully submitted to the API.
 */
@Injectable({ providedIn: 'root' })
export class DraftDeliveriesService {
  private readonly me = inject(MeStore);

  /** Storage key for the current user (falls back to a shared anon bucket). */
  private readonly storageKey = computed(
    () => `${KEY_PREFIX}:${this.me.user()?.id ?? 'anon'}`,
  );

  private readonly _drafts = signal<DraftDelivery[]>([]);
  /** Draft deliveries for the current user, newest first. */
  readonly drafts = this._drafts.asReadonly();
  readonly count = computed(() => this._drafts().length);

  constructor() {
    // Load (and reload) drafts whenever the signed-in user changes.
    effect(() => this._drafts.set(this.read(this.storageKey())));
  }

  /** Save a new draft and return it. */
  add(payload: PostDelivery): DraftDelivery {
    const draft: DraftDelivery = {
      id: crypto.randomUUID(),
      payload,
      createdAt: new Date().toISOString(),
    };
    this._drafts.update((drafts) => [draft, ...drafts]);
    this.persist();
    return draft;
  }

  /** Remove a draft (e.g. after it was submitted or discarded). */
  remove(id: string): void {
    this._drafts.update((drafts) => drafts.filter((d) => d.id !== id));
    this.persist();
  }

  private read(key: string): DraftDelivery[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as DraftDelivery[]) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this._drafts()));
    } catch {
      // Ignore quota/serialization errors — drafts stay in memory this session.
    }
  }
}
