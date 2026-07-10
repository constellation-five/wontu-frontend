import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../../core/notification.service';
import { IconButtonVariantDirective } from '../../directives/button/icon-button-variant';
import { ButtonSizeDirective } from '../../directives/button/button-size';

const AUTO_DISMISS_MS = 5000;
const EXIT_MS = 240;
const DRAG_DISMISS_THRESHOLD_PX = 90;

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
export class NotificationToast implements OnDestroy {
  protected readonly notificationService = inject(NotificationService);
  protected readonly cardStep = 98;

  private readonly leavingIds = signal<ReadonlySet<string>>(new Set());
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly seenIds = new Set<string>();
  private readonly dragStates = new Map<string, DragState>();

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
          this.clearTimer(id);
        }
      }
    });
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
}
