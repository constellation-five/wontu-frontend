import { Injectable, signal } from '@angular/core';

const TICK_INTERVAL_MS = 60_000;

/**
 * A signal that updates every minute — used purely to invalidate pure pipes
 * (e.g. naturalDateTime) whose displayed value depends on the current time,
 * so relative timestamps ("2m ago") stay fresh without a full data reload.
 */
@Injectable({ providedIn: 'root' })
export class TimeTickService {
  private readonly _now = signal(Date.now());
  readonly now = this._now.asReadonly();

  constructor() {
    setInterval(() => this._now.set(Date.now()), TICK_INTERVAL_MS);
  }
}
