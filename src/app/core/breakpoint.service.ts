import { Injectable, computed, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

// Matches $breakpoint-md in _variables.scss (840px) — the same cutoff the
// navbar rail already switches on. The rest of the app is mobile-first
// (mobile is just the unconditional base CSS, overridden only above this
// min-width), so isMobile here is defined as the exact negation of the same
// query rather than a separate max-width query — at a fractional width like
// 839.5px, `max-width: 839px` and `min-width: 840px` can BOTH fail to match,
// leaving a gap where this service disagreed with the CSS everywhere else.
export const DESKTOP_BREAKPOINT = '(min-width: 840px)';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isDesktop = toSignal(
    this.breakpointObserver.observe(DESKTOP_BREAKPOINT).pipe(map((state) => state.matches)),
    { initialValue: this.breakpointObserver.isMatched(DESKTOP_BREAKPOINT) },
  );

  readonly isMobile = computed(() => !this.isDesktop());
}
