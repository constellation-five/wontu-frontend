// theme.service.ts
import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'user-theme-preference';

  currentTheme = signal<ThemeMode>('system');

  constructor() {
    this.initTheme();
  }

  setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
    this.applyTheme(mode);
  }

  private initTheme(): void {
    const savedTheme = (localStorage.getItem(this.STORAGE_KEY) as ThemeMode) || 'system';
    this.currentTheme.set(savedTheme);
    this.applyTheme(savedTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.currentTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  private applyTheme(mode: ThemeMode): void {
    document.body.setAttribute('data-theme', mode);
  }
}
