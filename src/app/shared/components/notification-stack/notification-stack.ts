import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppNotification } from '../../../core/notification.service';
import { IconButtonVariantDirective } from '../../directives/button/icon-button-variant';
import { ButtonSizeDirective } from '../../directives/button/button-size';
import { NaturalDateTimePipe } from '../../pipes/natural-date-time.pipe';

export interface NotificationStackItem {
  id: string;
  notification: AppNotification;
}

const EXIT_MS = 240;
const DRAG_DISMISS_THRESHOLD_PX = 90;
const CARD_GAP_PX = 10;

interface DragState {
  startX: number;
  currentX: number;
  clone: HTMLElement;
  sourceEl: HTMLElement;
}

/**
 * Renders a stack of notification cards that can be dragged right to
 * dismiss, and reflow smoothly (via measured, absolutely-positioned
 * offsets) as cards are added or removed. Shared by the fixed-position
 * toast popups and the bell's dropdown list — the only difference between
 * those two is whether items auto-dismiss and what "dismissed" means to
 * the caller (removed from a signal vs. deleted on the backend).
 *
 * The bell's list sits inside a vertically-scrolling container, which (per
 * the CSS overflow spec) forces horizontal clipping too — there's no way to
 * let a card visually slide past that box's edge while it's still a normal
 * descendant of it. So the *moment* a drag starts (not just once it's
 * released past the dismiss threshold), the card is cloned into a
 * `position: fixed` node appended directly to `<body>` — completely outside
 * any clipping ancestor — and every further drag/exit/snap-back update is
 * applied to that clone instead. The original is hidden (not removed) for as
 * long as the clone represents it, so it keeps reserving its layout space.
 *
 * While a card is being dragged/dismissed its clone is raised to the very
 * top (`z-index` above everything) and its elevation is boosted, so the
 * lifted card and *its own* shadow are drawn over both neighbours — it reads
 * as a card physically picked up off the stack. No neighbouring shadows are
 * touched.
 */
@Component({
  selector: 'app-notification-stack',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    IconButtonVariantDirective,
    ButtonSizeDirective,
    NaturalDateTimePipe,
  ],
  templateUrl: './notification-stack.html',
  styleUrl: './notification-stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationStack implements AfterViewInit, OnDestroy {
  readonly items = input.required<NotificationStackItem[]>();
  /** If set, each item auto-dismisses this many ms after it first appears. Omit for a persistent list. */
  readonly autoDismissMs = input<number | null>(null);
  readonly dismissed = output<string>();

  @ViewChildren('wrapperEl') private readonly wrapperEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('containerEl') private readonly containerEl!: ElementRef<HTMLElement>;

  private readonly leavingIds = signal<ReadonlySet<string>>(new Set());
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly seenIds = new Set<string>();
  private readonly dragStates = new Map<string, DragState>();
  private wrappersByItemId = new Map<string, HTMLElement>();

  constructor() {
    effect(() => {
      const items = this.items();
      const currentIds = new Set(items.map((item) => item.id));
      const autoDismissMs = this.autoDismissMs();

      for (const item of items) {
        if (!this.seenIds.has(item.id)) {
          this.seenIds.add(item.id);
          if (autoDismissMs) {
            this.scheduleAutoDismiss(item.id, autoDismissMs);
          }
        }
      }

      for (const id of [...this.seenIds]) {
        if (!currentIds.has(id)) {
          this.seenIds.delete(id);
          this.wrappersByItemId.delete(id);
          this.clearTimer(id);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.syncWrappers();
    this.wrapperEls.changes.subscribe(() => this.syncWrappers());
  }

  ngOnDestroy(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
  }

  isLeaving(id: string): boolean {
    return this.leavingIds().has(id);
  }

  onDismissClick(id: string): void {
    this.beginDismiss(id);
  }

  onPointerDown(event: PointerEvent, id: string): void {
    if (this.isLeaving(id) || (event.target as HTMLElement).closest('.delete-btn')) {
      return;
    }
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture(event.pointerId);
    this.clearTimer(id);

    // Portal the card out from the very first pointer movement — not just
    // once dismissal is confirmed — so it's never clipped, no matter how far
    // it gets dragged before release.
    const clone = this.createPortalClone(el);
    el.style.visibility = 'hidden';
    this.dragStates.set(id, {
      startX: event.clientX,
      currentX: event.clientX,
      clone,
      sourceEl: el,
    });
  }

  onPointerMove(event: PointerEvent, id: string): void {
    const state = this.dragStates.get(id);
    if (!state) {
      return;
    }
    state.currentX = event.clientX;
    const dx = Math.max(0, state.currentX - state.startX);
    // Opacity stays fixed at 1 during the drag itself (only fading at the
    // very end, on release — see onPointerUp) — a partially-transparent
    // clone would otherwise let the exposed gap behind it (where the
    // original card was hidden) show through.
    state.clone.style.transform = `translateX(${dx}px)`;
  }

  onPointerUp(event: PointerEvent, id: string): void {
    const state = this.dragStates.get(id);
    if (!state) {
      return;
    }
    this.dragStates.delete(id);

    const { clone, sourceEl } = state;
    const dx = Math.max(0, state.currentX - state.startX);

    if (dx > DRAG_DISMISS_THRESHOLD_PX) {
      this.clearTimer(id);
      this.leavingIds.update((prev) => new Set(prev).add(id));
      clone.style.transition = 'transform 0.2s ease, opacity 0.12s ease';
      clone.style.transform = 'translateX(140%)';
      clone.style.opacity = '0';
      setTimeout(() => clone.remove(), 220);
      this.scheduleRemoval(id, EXIT_MS);
    } else {
      clone.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      clone.style.transform = '';
      clone.style.opacity = '1';
      setTimeout(() => {
        clone.remove();
        sourceEl.style.visibility = '';
        sourceEl.classList.remove('shadow-transition-backwards');
        void sourceEl.offsetWidth;
        sourceEl.classList.add('shadow-transition-backwards');
        const autoDismissMs = this.autoDismissMs();
        if (autoDismissMs) {
          this.scheduleAutoDismiss(id, autoDismissMs);
        }
      }, 200);
    }
  }

  private scheduleAutoDismiss(id: string, ms: number): void {
    this.clearTimer(id);
    const timer = setTimeout(() => this.beginDismiss(id), ms);
    this.timers.set(id, timer);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private beginDismiss(id: string): void {
    if (this.isLeaving(id)) {
      return;
    }
    this.clearTimer(id);
    this.leavingIds.update((prev) => new Set(prev).add(id));

    const el = this.getCardElement(id);
    if (el) {
      const clone = this.createPortalClone(el);
      el.style.visibility = 'hidden';
      requestAnimationFrame(() => {
        clone.style.transition = 'transform 0.24s ease, opacity 0.15s ease';
        clone.style.transform = 'translateX(140%)';
        clone.style.opacity = '0';
      });
      setTimeout(() => clone.remove(), 260);
    }
    this.scheduleRemoval(id, EXIT_MS);
  }

  private scheduleRemoval(id: string, delay: number): void {
    setTimeout(() => this.dismissed.emit(id), delay);
  }

  private getCardElement(id: string): HTMLElement | null {
    const wrapper = this.wrappersByItemId.get(id);
    return (wrapper?.firstElementChild as HTMLElement) ?? null;
  }

  /**
   * Clones `sourceEl` into a `position: fixed` element appended to `<body>`,
   * positioned to exactly overlap it — fully outside any ancestor that might
   * otherwise clip it (the source itself is hidden by the caller). The clone
   * is raised above everything and given a heightened elevation, so it (and
   * its own shadow) reads as a card lifted off the stack, drawn over both
   * neighbours. It stays fully opaque until the very end of its animation
   * (see onPointerUp/beginDismiss) — fading it gradually would let the hidden
   * source's now-empty gap show through.
   */
  private createPortalClone(sourceEl: HTMLElement): HTMLElement {
    const rect = sourceEl.getBoundingClientRect();
    const computed = getComputedStyle(sourceEl);

    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.classList.remove('leaving');
    clone.classList.remove('shadow-transition-backwards');
    clone.classList.add('shadow-transition-forwards');
    clone.style.position = 'fixed';
    clone.style.margin = '0';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.transition = 'none';
    // Carry over whatever transform/opacity the source already had (e.g. a
    // still-running entrance animation) so the handoff is visually seamless.
    clone.style.transform = computed.transform === 'none' ? '' : computed.transform;
    clone.style.opacity = computed.opacity;

    document.body.appendChild(clone);
    return clone;
  }

  /**
   * Pairs each rendered `.stack-wrapper` with its item id (array order
   * matches the @for order) and recomputes every wrapper's stacking offset.
   * Runs whenever a wrapper is added or removed.
   */
  private syncWrappers(): void {
    const items = this.items();
    const refs = this.wrapperEls.toArray();

    this.wrappersByItemId.clear();
    refs.forEach((ref, i) => {
      const item = items[i];
      if (item) {
        this.wrappersByItemId.set(item.id, ref.nativeElement);
      }
    });

    this.recomputeOffsets();
  }

  /**
   * Positions each card at the cumulative rendered height of the cards
   * stacked above it, measured live from the DOM — so any content height
   * works, with no clipping. Each wrapper animates to its new offset via its
   * own `transition: transform`, so adding/removing an item smoothly pushes
   * the others down/up entirely through normal, composited transforms.
   */
  private recomputeOffsets(): void {
    const items = this.items();
    let cumulative = 0;
    for (const item of items) {
      const el = this.wrappersByItemId.get(item.id);
      if (!el) {
        continue;
      }
      el.style.transform = `translateY(${cumulative}px)`;
      cumulative += el.offsetHeight + CARD_GAP_PX;
    }
    // Children are absolutely positioned, so the container needs its own
    // height set explicitly — matters when this stack sits among normal-flow
    // siblings (e.g. the bell's dropdown), not just as a floating overlay.
    // The height change is CSS-transitioned (see the stylesheet), in sync
    // with the wrappers' own transform transition, so the box doesn't snap
    // to its new (smaller) size before the last wrapper has finished moving
    // into place — which would otherwise clip it mid-animation.
    if (this.containerEl) {
      const totalHeight = items.length > 0 ? Math.max(0, cumulative - CARD_GAP_PX) : 0;
      this.containerEl.nativeElement.style.height = `${totalHeight}px`;
    }
  }
}
