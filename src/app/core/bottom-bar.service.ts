import { Injectable, signal } from '@angular/core';
import { Portal } from '@angular/cdk/portal';

/**
 * A stack, not a single slot: nested pages/dialogs (e.g. the Add/Edit Item
 * dialog opened from the Create Offer page) each push their own bottom-bar
 * content and pop it on destroy, so closing a nested one correctly restores
 * whatever the page underneath had set — rather than clobbering it.
 */
@Injectable({
  providedIn: 'root',
})
export class BottomBarService {
  private readonly stack: Portal<any>[] = [];

  readonly portal = signal<Portal<any> | null>(null);

  push(portal: Portal<any>) {
    this.stack.push(portal);
    this.portal.set(portal);
  }

  pop(portal: Portal<any>) {
    const index = this.stack.lastIndexOf(portal);
    if (index !== -1) {
      this.stack.splice(index, 1);
    }
    this.portal.set(this.stack[this.stack.length - 1] ?? null);
  }
}
