import { Injectable, Type, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  MOBILE_BREAKPOINT,
  ResponsiveDialogWrapper,
  ResponsiveDialogWrapperData,
} from './responsive-dialog-wrapper';

export interface ResponsiveDialogConfig<D> {
  title: string;
  data?: D;
  /** Desktop dialog width. Ignored on mobile (always full screen). */
  width?: string;
  disableClose?: boolean;
}

/**
 * Opens `component` as a normal MatDialog on desktop, or as a full-screen,
 * page-like view (top bar + optional bottom bar) on mobile — without needing
 * a dedicated route. See ResponsiveDialogContext for how the opened
 * component can adapt (e.g. move its primary action into the bottom bar).
 */
@Injectable({ providedIn: 'root' })
export class ResponsiveDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly breakpointObserver = inject(BreakpointObserver);

  open<T, D = unknown, R = unknown>(
    component: Type<T>,
    config: ResponsiveDialogConfig<D>,
  ): MatDialogRef<ResponsiveDialogWrapper, R> {
    const isMobile = this.breakpointObserver.isMatched(MOBILE_BREAKPOINT);

    const wrapperData: ResponsiveDialogWrapperData<D> = {
      component,
      title: config.title,
      componentData: config.data,
    };

    return this.dialog.open<ResponsiveDialogWrapper, ResponsiveDialogWrapperData<D>, R>(
      ResponsiveDialogWrapper,
      {
        data: wrapperData,
        disableClose: config.disableClose ?? false,
        panelClass: isMobile ? 'responsive-dialog-fullscreen' : 'responsive-dialog-normal',
        width: isMobile ? '100vw' : (config.width ?? '560px'),
        maxWidth: isMobile ? '100vw' : '90vw',
        height: isMobile ? '100dvh' : undefined,
        maxHeight: isMobile ? '100dvh' : '90vh',
        autoFocus: false,
      },
    );
  }
}
