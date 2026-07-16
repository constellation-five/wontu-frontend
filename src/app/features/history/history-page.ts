import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe, DatePipe } from '@angular/common';
import { PaneComponent } from '../../shared/components/pane/pane';
import { PageHeaderService } from '../../core/page-header.service';
import { Offer, OfferService } from '../../core/offer.service';
import { ButtonSizeDirective } from '../../shared/directives/button';

interface HistoryOrder {
  offerId: number;
  merchantName: string;
  totalItems: number;
  totalPrice: number;
  orderDate: Date;
  status: 'pending' | 'confirmed';
  items: {
    itemName: string;
    quantity: number;
    price: string;
    imageUrl?: string;
  }[];
}

type SellerOfferStatus = 'open' | 'closed' | 'arrived';

interface HistoryOffer {
  offerId: number;
  merchantName: string;
  category: string;
  itemCount: number;
  imageUrl?: string;
  status: SellerOfferStatus;
}

@Component({
  selector: 'history-page',
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
  templateUrl: './history-page.html',
  styleUrls: ['./history-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPage {
  private readonly router = inject(Router);
  protected readonly pageHeader = inject(PageHeaderService);
  private readonly offerService = inject(OfferService);

  orders = signal<HistoryOrder[]>([]);
  offers = signal<HistoryOffer[]>([]);

  constructor() {
    this.pageHeader.setTitle('Order History');
    this.pageHeader.setBreadcrumbs([{ label: 'Order History' }]);
    this.loadOrderHistory();
    this.loadMyOffers();
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
            status: order.is_confirmed ? 'confirmed' : 'pending',
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
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'var(--mat-sys-primary)';
      case 'confirmed': return 'var(--mat-sys-tertiary)';
      default: return 'var(--mat-sys-on-surface)';
    }
  }

  viewOrderDetail(order: HistoryOrder) {
    this.router.navigate(['/offers', order.offerId]);
  }

  private loadMyOffers() {
    this.offerService.getMyOffers().subscribe({
      next: (res) => {
        const offers: HistoryOffer[] = (res.data || []).map((offer: Offer) => ({
          offerId: offer.offer_id,
          merchantName: offer.merchant_name,
          category: offer.category,
          itemCount: offer.items.length,
          imageUrl: offer.items[0]?.image_url,
          status: this.deriveOfferStatus(offer),
        }));

        this.offers.set(offers);
      },
      error: (err) => {
        console.error('Failed to load your offers:', err);
      },
    });
  }

  private deriveOfferStatus(offer: Offer): SellerOfferStatus {
    if (offer.arrived_at) return 'arrived';
    if (offer.closed_at) return 'closed';
    return 'open';
  }

  getOfferStatusLabel(status: SellerOfferStatus): string {
    switch (status) {
      case 'open': return 'Open';
      case 'closed': return 'Closed';
      case 'arrived': return 'Items Arrived';
      default: return status;
    }
  }

  getOfferStatusColor(status: SellerOfferStatus): string {
    switch (status) {
      case 'open': return 'var(--mat-sys-primary)';
      case 'closed': return 'var(--mat-sys-error)';
      case 'arrived': return 'var(--mat-sys-tertiary)';
      default: return 'var(--mat-sys-on-surface)';
    }
  }

  viewOfferDetail(offer: HistoryOffer) {
    this.router.navigate(['/offers', offer.offerId]);
  }
}
