import { Injectable, signal } from '@angular/core';

export type Theme = 'auto' | 'dark' | 'light';

const STORAGE_KEY = 'appearance';

/**
 * Applies and persists the color theme. `auto` follows the OS preference and
 * reacts to system changes; `dark`/`light` force the theme. The theme is a
 * `dark` class toggled on `<html>` (see `:root.dark` in styles.scss).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');

  /** The user's selected theme preference. */
  readonly theme = signal<Theme>(this.restore());

  constructor() {
    this.apply(this.theme());
    // Keep in sync with the OS while on `auto`.
    this.media.addEventListener('change', () => {
      if (this.theme() === 'auto') this.apply('auto');
    });
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this.apply(theme);
  }

  private restore(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' || stored === 'auto'
      ? stored
      : 'light';
  }

  private apply(theme: Theme): void {
    const dark = theme === 'dark' || (theme === 'auto' && this.media.matches);
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  }
}
