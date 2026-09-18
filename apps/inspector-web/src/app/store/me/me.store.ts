import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import type { PublicUser } from '@tax-inspection/shared';

const STORAGE_KEY = 'auth.session';

interface MeState {
  /** The currently signed-in user, or `null` when logged out. */
  user: PublicUser | null;
  /** Short-lived JWT sent as a Bearer on API requests, or `null`. */
  accessToken: string | null;
  /** Long-lived JWT exchanged for new access tokens, or `null`. */
  refreshToken: string | null;
}

interface PersistedSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

/** Derive up-to-two-letter initials from a full name, e.g. "John Doe" → "JD". */
function initialsOf(fullname: string | undefined): string {
  if (!fullname) return '';
  return fullname
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const EMPTY: MeState = { user: null, accessToken: null, refreshToken: null };

/** Rehydrate the session from localStorage so a refresh keeps the user signed in. */
function restore(): MeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const { user, accessToken, refreshToken } = JSON.parse(
      raw,
    ) as PersistedSession;
    return { user, accessToken, refreshToken };
  } catch {
    return EMPTY;
  }
}

/**
 * Holds the current logged-in user for the whole app. Populated by
 * `AuthService` after a successful login and read by the auth guard, the
 * layout header, etc.
 */
export const MeStore = signalStore(
  { providedIn: 'root' },
  withState<MeState>(() => restore()),
  withComputed(({ user, refreshToken }) => ({
    // Authenticated as long as we hold a refresh token — the access token may
    // be expired and transparently refreshed on the next request.
    isAuthenticated: computed(
      () => user() !== null && refreshToken() !== null,
    ),
    fullname: computed(() => user()?.fullname ?? ''),
    email: computed(() => user()?.email ?? ''),
    role: computed(() => user()?.role ?? null),
    avatar: computed(() => user()?.avatar ?? ''),
    initials: computed(() => initialsOf(user()?.fullname)),
  })),
  withMethods((store) => ({
    /** Store the signed-in user + tokens and persist the session. */
    setSession(
      user: PublicUser,
      accessToken: string,
      refreshToken: string,
    ): void {
      patchState(store, { user, accessToken, refreshToken });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          accessToken,
          refreshToken,
        } satisfies PersistedSession),
      );
    },
    /** Replace just the access token after a refresh; re-persist the session. */
    setAccessToken(accessToken: string): void {
      patchState(store, { accessToken });
      const { user, refreshToken } = store;
      if (user() && refreshToken()) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user: user()!,
            accessToken,
            refreshToken: refreshToken()!,
          } satisfies PersistedSession),
        );
      }
    },
    /** Merge changes into the signed-in user and re-persist the session. */
    updateUser(changes: Partial<PublicUser>): void {
      const current = store.user();
      if (!current) return;
      const user = { ...current, ...changes };
      patchState(store, { user });
      const { accessToken, refreshToken } = store;
      if (accessToken() && refreshToken()) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user,
            accessToken: accessToken()!,
            refreshToken: refreshToken()!,
          } satisfies PersistedSession),
        );
      }
    },
    /** Clear the session (logout). */
    clear(): void {
      patchState(store, EMPTY);
      localStorage.removeItem(STORAGE_KEY);
    },
  })),
);
