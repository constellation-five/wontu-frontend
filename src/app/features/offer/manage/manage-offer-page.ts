import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplatePortal } from '@angular/cdk/portal';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { TimelineBar, TimelineItem } from '../../../shared/components/timeline-bar/timeline-bar';
import { CartItemCard } from '../../../shared/components/cart-item-card/cart-item-card';
import {
  PaymentMethodCard,
  PaymentMethodData,
} from '../../../shared/components/payment-method-card/payment-method-card';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { UserProfileDialog } from '../../../shared/components/dialog/user-profile-dialog/user-profile-dialog';
import { ImagePreviewDialog } from '../../../shared/components/image-preview-dialog/image-preview-dialog';
import { BottomBar } from '../../../shared/components/bottom-bar/bottom-bar';
import { ButtonSizeDirective, ButtonColorDirective } from '../../../shared/directives/button';
import { BottomBarService } from '../../../core/bottom-bar.service';
import { PageHeaderService } from '../../../core/page-header.service';
import { EchoService } from '../../../core/echo.service';
import { OfferService, Offer, OfferOrder, CheckoutItem } from '../../../core/offer.service';

@Component({
  selector: 'app-manage-offer-page',
  standalone: true,
  imports: [
    DecimalPipe,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    PaneComponent,
    TimelineBar,
    CartItemCard,
    PaymentMethodCard,
    BottomBar,
    ButtonSizeDirective,
    ButtonColorDirective,
  ],
  templateUrl: './manage-offer-page.html',
  styleUrls: ['./manage-offer-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ManageOfferPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly offerService = inject(OfferService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bottomBarService = inject(BottomBarService);
  private readonly pageHeader = inject(PageHeaderService);
  private readonly echoService = inject(EchoService);

  @ViewChild('actionsTpl') private actionsTpl!: TemplateRef<unknown>;
  private readonly viewContainerRef = inject(ViewContainerRef);

  readonly offerInput = input.required<Offer>();
  readonly offer = signal<Offer>(undefined as unknown as Offer);
  readonly orders = signal<OfferOrder[]>([]);
  readonly paymentMethods = signal<PaymentMethodData[]>([]);
  readonly isLoading = signal(true);
  readonly isActionInProgress = signal(false);

  private initialized = false;

  constructor() {
    // Keep the local offer signal in sync with the parent's input signal.
    // This ensures real-time updates from the parent's Echo listener propagate here.
    // On subsequent changes (after init), also reload the orders list.
    effect(() => {
      const latest = this.offerInput();
      if (latest) {
        this.offer.set(latest);
        if (this.initialized) {
          this.loadOrders();
        }
      }
    });
  }

  readonly isClosed = computed(() => this.offer().closed_at != null);
  readonly isArrived = computed(() => this.offer().arrived_at != null);

  readonly currentStep = computed(() => {
    const offer = this.offer();
    const orders = this.orders();
    
    if (offer.arrived_at != null) return 3;
    if (
      offer.payments_confirmed_at != null ||
      (offer.closed_at != null && orders.length > 0 && orders.every((o) => o.is_confirmed))
    ) {
      return 2;
    }
    if (offer.closed_at != null) return 1;
    return 0;
  });

  readonly timelineItems = computed<TimelineItem[]>(() => {
    const offer = this.offer();
    return [
      { label: $localize`Offer opened`, time: offer.created_at },
      // Falls back to the seller's originally planned schedule until the
      // actual event happens (closed_at/arrived_at are only set then).
      { label: offer.closed_at ? $localize`Offer closed` : $localize`Offer closes`, time: offer.closed_at ?? offer.closing_time },
      { label: $localize`Payments confirmed`, time: offer.payments_confirmed_at ?? undefined },
      { label: offer.arrived_at ? $localize`Items arrived` : $localize`Items arrive`, time: offer.arrived_at ?? offer.arrival_time },
    ];
  });

  ngOnInit() {
    this.offer.set(this.offerInput());

    this.pageHeader.setTitle(this.offer().merchant_name);
    this.pageHeader.setBreadcrumbs([
      { label: $localize`Offers`, route: '/offers' },
      { label: this.offer().merchant_name },
    ]);

    this.loadOrders();
    this.loadPaymentMethods();
    this.initialized = true;
  }

  private ownPortal!: TemplatePortal;

  ngAfterViewInit() {
    this.ownPortal = new TemplatePortal(this.actionsTpl, this.viewContainerRef);
    this.bottomBarService.push(this.ownPortal);
  }

  ngOnDestroy() {
    if (this.ownPortal) {
      this.bottomBarService.pop(this.ownPortal);
    }
  }

  private loadOrders() {
    this.isLoading.set(true);
    this.offerService.getOfferOrders(this.offer().offer_id).subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.isLoading.set(false);
      },
    });
  }

  private loadPaymentMethods() {
    this.offerService.getOfferPaymentMethods(this.offer().offer_id).subscribe({
      next: (res) => this.paymentMethods.set(res.data || []),
      error: (err) => console.error('Failed to load payment methods:', err),
    });
  }

  orderItemCount(order: OfferOrder): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  orderItemCountLabel(order: OfferOrder): string {
    const count = this.orderItemCount(order);
    return `${count} item${count === 1 ? '' : 's'}`;
  }

  paymentStatus(order: OfferOrder): 'not_paid' | 'pending' | 'confirmed' {
    if (order.is_confirmed) return 'confirmed';
    if (order.payment_submitted_at) return 'pending';
    return 'not_paid';
  }

  paymentStatusLabel(order: OfferOrder): string {
    switch (this.paymentStatus(order)) {
      case 'confirmed':
        return $localize`Confirmed`;
      case 'pending':
        return $localize`Pending confirmation`;
      default:
        return $localize`Not paid`;
    }
  }

  orderTotal(order: OfferOrder): number {
    return order.items.reduce((sum, item) => sum + +item.item.item_price * item.quantity, 0);
  }

  viewProofOfPayment(order: OfferOrder) {
    if (!order.payment_proof_url) return;
    this.dialog.open(ImagePreviewDialog, {
      width: '1600px',
      data: { imageUrl: order.payment_proof_url, title: $localize`Proof of Payment` },
    });
  }

  confirmPayment(order: OfferOrder) {
    if (order.is_confirmed) return;
    this.offerService.confirmPayment(this.offer().offer_id, order.offer_buyer_id).subscribe({
      next: (res) => {
        this.snackBar.open($localize`Payment confirmed successfully.`, $localize`Close`, { duration: 3000 });
        this.orders.update((orders) =>
          orders.map((o) =>
            o.offer_buyer_id === order.offer_buyer_id ? { ...o, is_confirmed: true } : o,
          ),
        );
        if (res.offer) {
          this.offer.set(res.offer);
        }
      },
      error: (err) => {
        console.error('Failed to confirm payment:', err);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open($localize`Failed to confirm payment: ${msg}${status}`, $localize`Close`, {
          duration: 5000,
        });
      },
    });
  }

  itemRemainingText(item: { slot: number; current_slot: number }): string {
    if (this.isClosed()) return `${item.slot}`;
    return `${item.slot - item.current_slot}/${item.slot}`;
  }

  closeOfferNow() {
    if (this.isActionInProgress()) return;
    
    const offer = this.offer();
    const isSoldOut = offer.items.every(item => item.current_slot >= item.slot);
    
    if (!isSoldOut) {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '540px',
        data: {
          title: $localize`Close Offer Early`,
          content: $localize`Are you sure you want to close this offer early? Not all items have been sold out yet.`,
          buttons: [
            { label: $localize`Cancel`, type: 'outlined', focus: true },
            { label: $localize`Close offer`, type: 'filled', color: 'error', action: 'confirm' }
          ]
        }
      });
      
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.executeCloseOffer();
        }
      });
    } else {
      this.executeCloseOffer();
    }
  }

  private executeCloseOffer() {
    this.isActionInProgress.set(true);
    this.offerService.closeOfferNow(this.offer().offer_id).subscribe({
      next: (res) => {
        this.isActionInProgress.set(false);
        this.snackBar.open($localize`Offer closed successfully.`, $localize`Close`, { duration: 3000 });
        this.offer.set(res.offer ?? { ...this.offer(), closed_at: new Date().toISOString() });
      },
      error: (err) => {
        this.isActionInProgress.set(false);
        console.error('Failed to close offer:', err);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open($localize`Failed to close offer: ${msg}${status}`, $localize`Close`, { duration: 5000 });
      },
    });
  }

  markItemsArrived() {
    if (this.isActionInProgress() || this.isArrived()) return;
    this.isActionInProgress.set(true);
    this.offerService.markItemsArrived(this.offer().offer_id).subscribe({
      next: (res) => {
        this.isActionInProgress.set(false);
        this.snackBar.open($localize`Items marked as arrived.`, $localize`Close`, { duration: 3000 });
        this.offer.set(res.offer ?? { ...this.offer(), arrived_at: new Date().toISOString() });
      },
      error: (err) => {
        this.isActionInProgress.set(false);
        console.error('Failed to mark items as arrived:', err);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open($localize`Failed to mark items as arrived: ${msg}${status}`, $localize`Close`, {
          duration: 5000,
        });
      },
    });
  }

  openChat() {
    this.router.navigate(['/offers', this.offer().offer_id, 'chat']);
  }

  openBuyerProfile(userId: string, event: Event) {
    event.stopPropagation();
    this.dialog.open(UserProfileDialog, {
      data: { userId: userId },
      width: '400px',
      maxWidth: '90vw',
      panelClass: 'user-profile-dialog-container',
    });
  }

  editOffer() {
    this.router.navigate(['/offers', this.offer().offer_id, 'edit']);
  }

  openDeleteConfirm() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '540px',
      data: {
        title: $localize`Delete Offer`,
        content: $localize`Are you sure you want to delete this offer?<br>This action cannot be undone.`,
        buttons: [
          { label: $localize`Cancel`, type: 'outlined', focus: true },
          {
            label: $localize`Delete offer`,
            icon: 'delete',
            type: 'filled',
            action: 'delete',
            color: 'error',
          },
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.deleteOffer();
      }
    });
  }

  private deleteOffer() {
    this.offerService.deleteOffer(this.offer().offer_id).subscribe({
      next: () => {
        this.snackBar.open($localize`Offer deleted successfully.`, $localize`Close`, { duration: 3000 });
        this.router.navigate(['/offers']);
      },
      error: (err) => {
        console.error('Failed to delete offer:', err);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open($localize`Failed to delete offer: ${msg}${status}`, $localize`Close`, { duration: 5000 });
      },
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ', ' +
      date
        .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
        .replace('am', 'AM')
        .replace('pm', 'PM')
    );
  }
}
