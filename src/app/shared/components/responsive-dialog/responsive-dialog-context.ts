import { InjectionToken, Signal } from '@angular/core';

/**
 * Injected into every component opened via ResponsiveDialogService, so it can
 * tell whether it's rendered as a normal dialog (desktop) or as a full-screen
 * page-like view (mobile) and adjust e.g. where its primary action button
 * goes (inline vs. BottomBarService).
 */
export interface ResponsiveDialogContext {
  isMobile: Signal<boolean>;
}

export const RESPONSIVE_DIALOG_CONTEXT = new InjectionToken<ResponsiveDialogContext>(
  'RESPONSIVE_DIALOG_CONTEXT',
);
