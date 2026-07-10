import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../../core/notification.service';
import { IconButtonVariantDirective } from '../../directives/button/icon-button-variant';
import { ButtonSizeDirective } from '../../directives/button/button-size';

const AUTO_DISMISS_MS = 5000;
const EXIT_MS = 240;
const DRAG_DISMISS_THRESHOLD_PX = 90;
const CARD_GAP_PX = 10;

interface DragState {
  startX: number;
  currentX: number;
}

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, IconButtonVariantDirective, ButtonSizeDirective],
  templateUrl: './notification-toast.html',
  styleUrl: './notification-toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToast implements AfterViewInit, OnDestroy {
  protected readonly notificationService = inject(NotificationService);

  @ViewChildren('wrapperEl') private readonly wrapperEls!: QueryList<ElementRef<HTMLElement>>;

  private readonly leavingIds = signal<ReadonlySet<string>>(new Set());
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly seenIds = new Set<string>();
  private readonly dragStates = new Map<string, DragState>();
  private wrappersByToastId = new Map<string, HTMLElement>();

  constructor() {
    effect(() => {
      const toasts = this.notificationService.toasts();
      const currentIds = new Set(toasts.map((t) => t.toastId));

      for (const toast of toasts) {
        if (!this.seenIds.has(toast.toastId)) {
          this.seenIds.add(toast.toastId);
          this.scheduleAutoDismiss(toast.toastId);
        }
      }

      for (const id of [...this.seenIds]) {
        if (!currentIds.has(id)) {
          this.seenIds.delete(id);
          this.wrappersByToastId.delete(id);
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

  isLeaving(toastId: string): boolean {
    return this.leavingIds().has(toastId);
  }

  onDismissClick(toastId: string): void {
    this.beginDismiss(toastId);
  }

  onPointerDown(event: PointerEvent, toastId: string): void {
    if (this.isLeaving(toastId) || (event.target as HTMLElement).closest('.delete-btn')) {
      return;
    }
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture(event.pointerId);
    this.clearTimer(toastId);
    this.dragStates.set(toastId, { startX: event.clientX, currentX: event.clientX });
    // Cancel a still-running entrance animation so it can't override the
    // drag's transform (same conflict fixed for `.leaving` in the SCSS).
    el.style.animation = 'none';
    el.style.transition = 'none';
  }

  onPointerMove(event: PointerEvent, toastId: string): void {
    const state = this.dragStates.get(toastId);
    if (!state) {
      return;
    }
    state.currentX = event.clientX;
    const dx = Math.max(0, state.currentX - state.startX);
    const el = event.currentTarget as HTMLElement;
    el.style.transform = `translateX(${dx}px)`;
    el.style.opacity = `${Math.max(1 - dx / 220, 0.15)}`;
  }

  onPointerUp(event: PointerEvent, toastId: string): void {
    const state = this.dragStates.get(toastId);
    if (!state) {
      return;
    }
    this.dragStates.delete(toastId);

    const el = event.currentTarget as HTMLElement;
    const dx = Math.max(0, state.currentX - state.startX);
    el.style.transition = 'transform 0.2s ease, opacity 0.2s ease';

    if (dx > DRAG_DISMISS_THRESHOLD_PX) {
      el.style.transform = 'translateX(140%)';
      el.style.opacity = '0';
      this.clearTimer(toastId);
      this.leavingIds.update((prev) => new Set(prev).add(toastId));
      this.scheduleRemoval(toastId, 200);
    } else {
      el.style.transform = '';
      el.style.opacity = '';
      this.scheduleAutoDismiss(toastId);
    }
  }

  private scheduleAutoDismiss(toastId: string): void {
    this.clearTimer(toastId);
    const timer = setTimeout(() => this.beginDismiss(toastId), AUTO_DISMISS_MS);
    this.timers.set(toastId, timer);
  }

  private clearTimer(toastId: string): void {
    const timer = this.timers.get(toastId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(toastId);
    }
  }

  private beginDismiss(toastId: string): void {
    if (this.isLeaving(toastId)) {
      return;
    }
    this.clearTimer(toastId);
    this.leavingIds.update((prev) => new Set(prev).add(toastId));
    this.scheduleRemoval(toastId, EXIT_MS);
  }

  private scheduleRemoval(toastId: string, delay: number): void {
    setTimeout(() => this.notificationService.dismissToast(toastId), delay);
  }

  /**
   * Pairs each rendered `.toast-wrapper` with its toast id (array order
   * matches the @for order) and recomputes every wrapper's stacking offset.
   * Runs whenever a wrapper is added or removed — i.e. a toast arrives, or
   * one finishes leaving and is actually removed from the array.
   */
  private syncWrappers(): void {
    const toasts = this.notificationService.toasts();
    const refs = this.wrapperEls.toArray();

    this.wrappersByToastId.clear();
    refs.forEach((ref, i) => {
      const toast = toasts[i];
      if (toast) {
        this.wrappersByToastId.set(toast.toastId, ref.nativeElement);
      }
    });

    this.recomputeOffsets();
  }

  /**
   * Positions each toast at the cumulative rendered height of the toasts
   * stacked above it, measured live from the DOM — so any content height
   * works, with no clipping. Each wrapper animates to its new offset via its
   * own `transition: transform`, so adding/removing a toast smoothly pushes
   * the others down/up entirely through normal, composited transforms.
   */
  private recomputeOffsets(): void {
    const toasts = this.notificationService.toasts();
    let cumulative = 0;
    for (const toast of toasts) {
      const el = this.wrappersByToastId.get(toast.toastId);
      if (!el) {
        continue;
      }
      el.style.transform = `translateY(${cumulative}px)`;
      cumulative += el.offsetHeight + CARD_GAP_PX;
    }
  }
}
