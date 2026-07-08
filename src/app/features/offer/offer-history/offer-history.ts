import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe, DatePipe } from '@angular/common';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { PageHeaderService } from '../../../core/page-header.service';
import { OfferService } from '../../../core/offer.service';
import { ButtonSizeDirective } from '../../../shared/directives/button';

interface HistoryOrder {
  offerId: number;
  merchantName: string;
  totalItems: number;
  totalPrice: number;
  orderDate: Date;
  status: 'pending' | 'confirmed' | 'completed';
  items: {
    itemName: string;
    quantity: number;
    price: string;
    imageUrl?: string;
  }[];
}

@Component({
  selector: 'app-offer-history',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    PaneComponent,
    ButtonSizeDirective,
    DecimalPipe,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './offer-history.html',
  styleUrls: ['./offer-history.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferHistoryPage {
  private readonly router = inject(Router);
  protected readonly pageHeader = inject(PageHeaderService);
  private readonly offerService = inject(OfferService);

  orders = signal<HistoryOrder[]>([]);

  constructor() {
    this.pageHeader.setTitle('Order History');
    this.pageHeader.setBreadcrumbs([{ label: 'Order History' }]);
    this.loadOrderHistory();
  }

  private loadOrderHistory() {
    this.offerService.getMyOrders().subscribe({
      next: (res) => {
        const orders: HistoryOrder[] = (res.data || []).map((order) => {
          const items = order.items.map((checkoutItem) => ({
            itemName: checkoutItem.item.item_name || 'Unknown Item',
            quantity: checkoutItem.quantity || 0,
            price: checkoutItem.item.item_price || '0',
            imageUrl: checkoutItem.item.image_url || '',
          }));

          const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
          const totalPrice = items.reduce(
            (sum, item) => sum + parseFloat(item.price) * item.quantity,
            0,
          );

          return {
            offerId: order.offer_id,
            merchantName: order.merchant_name,
            totalItems,
            totalPrice,
            orderDate: new Date(order.created_at),
            status: order.status,
            items,
          };
        });

        this.orders.set(orders);
      },
      error: (err) => {
        console.error('Failed to load order history:', err);
      },
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'var(--mat-sys-primary)';
      case 'confirmed': return 'var(--mat-sys-tertiary)';
      case 'completed': return 'var(--mat-sys-tertiary)';
      default: return 'var(--mat-sys-on-surface)';
    }
  }

  viewOrderDetail(order: HistoryOrder) {
    this.router.navigate(['/offers', order.offerId]);
  }
}
