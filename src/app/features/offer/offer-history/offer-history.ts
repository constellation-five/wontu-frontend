import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
  status: 'placed' | 'completed' | 'cancelled';
  items: {
    itemName: string;
    quantity: number;
    price: string;
    imageUrl?: string;
  }[];
  rawItems?: any[]; // Keep raw CheckoutItem data
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

  clearAllHistory() {
    // Clear all history from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('history_') || key.startsWith('cart_'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`Cleared ${keysToRemove.length} items from localStorage`);
    
    // Reload history (should be empty now)
    this.loadOrderHistory();
  }

  private loadOrderHistory() {
    // Load from history localStorage (key: history_*)
    const orders: HistoryOrder[] = [];
    
    // Scan all localStorage keys for history data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('history_')) {
        const historyData = localStorage.getItem(key);
        
        if (historyData) {
          try {
            const orderData = JSON.parse(historyData);
            console.log('History data for', key, ':', orderData);
            
            if (orderData.items && Array.isArray(orderData.items)) {
              // Items are already in CheckoutItem format from cartItems()
              const items = orderData.items.map((checkoutItem: any) => ({
                itemName: checkoutItem.item.item_name || 'Unknown Item',
                quantity: checkoutItem.quantity || 0,
                price: checkoutItem.item.item_price || '0',
                imageUrl: checkoutItem.item.image_url || '', // Keep image URL
              }));
              
              const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
              const totalPrice = items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0);
              
              orders.push({
                offerId: orderData.offerId,
                merchantName: orderData.merchantName,
                totalItems,
                totalPrice,
                orderDate: new Date(orderData.orderDate),
                status: orderData.status || 'placed',
                items,
                rawItems: orderData.items, // Keep raw CheckoutItem data for viewOrderDetail
              });
            }
          } catch (e) {
            console.error('Error parsing history data for', key, ':', e);
          }
        }
      }
    }
    
    // Sort by date descending (newest first)
    orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
    
    console.log('Total orders found in history:', orders.length);
    this.orders.set(orders);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'placed': return 'Order Placed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'placed': return 'var(--mat-sys-primary)';
      case 'completed': return 'var(--mat-sys-tertiary)';
      case 'cancelled': return 'var(--mat-sys-error)';
      default: return 'var(--mat-sys-on-surface)';
    }
  }

  viewOrderDetail(order: HistoryOrder) {
    // Use raw CheckoutItem data if available (includes full item data with images)
    const checkoutItems = order.rawItems || [];

    // Save to service state so the offer detail page shows the checkout view
    this.offerService.setCheckoutState(order.offerId, checkoutItems);

    this.router.navigate(['/offers', order.offerId]);
  }
}
