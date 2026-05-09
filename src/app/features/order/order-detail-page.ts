import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Location } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  item_id: number;
  item_name: string;
  quantity: number;
  item_price: number;
  image?: string;
  notes?: string;
}

export interface OrderDetail {
  order_id: number;
  customer: {
    name: string;
    email: string;
    avatar: string;
  };
  order: {
    status: 'pending' | 'confirmed' | 'completed';
    total_amount: number;
    payment_proof_url: string;
    notes: string;
  };
  items: OrderItem[];
}

@Component({
  selector: 'order-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPage implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private location = inject(Location); 

  orderDetail = signal<OrderDetail | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  environment = environment;

  goBack() {
    this.location.back();
  }

  ngOnInit() {
    const offerId = this.route.snapshot.paramMap.get('offerId');
    const buyerId = this.route.snapshot.paramMap.get('buyerId');

    if (offerId && buyerId) {
      this.fetchOrderDetail(offerId, buyerId);
    } else {
      this.errorMessage.set('Invalid order URL');
      this.isLoading.set(false);
    }
  }

  private fetchOrderDetail(offerId: string, buyerId: string) {
    const apiUrl = `${environment.api}/offers/${offerId}/buyers/${buyerId}`;

    this.http
      .get<OrderDetail>(apiUrl)
      .subscribe({
        next: (data) => {
          this.orderDetail.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.warn('API not available, loading mock data for testing');
          this.loadMockData(offerId, buyerId); 
        },
      });
  }

  private loadMockData(offerId: string, buyerId: string) {
    const mockOrder: OrderDetail = {
      order_id: parseInt(offerId),
      customer: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'https://ui-avatars.com/api/?background=e2e8f0&color=1e293b&text=JD'
      },
      order: {
        status: 'pending',
        total_amount: 109000,
        payment_proof_url: 'https://placehold.co/400x600/4CAF50/FFFFFF?text=Payment+Proof',
        notes: ''
      },
      items: [
        {
          item_id: 1,
          item_name: 'Nasi Goreng Special',
          quantity: 2,
          item_price: 25000,
          image: 'https://placehold.co/200x200/FF9800/FFFFFF?text=Nasi+Goreng',
          notes: 'Extra spicy, no onions'
        },
        {
          item_id: 2,
          item_name: 'Ayam Bakar',
          quantity: 1,
          item_price: 35000,
          image: 'https://placehold.co/200x200/2196F3/FFFFFF?text=Ayam+Bakar',
          notes: 'Well done'
        },
        {
          item_id: 3,
          item_name: 'Es Teh Manis',
          quantity: 3,
          item_price: 8000,
          image: 'https://placehold.co/200x200/9C27B0/FFFFFF?text=Es+Teh',
        }
      ]
    };

    // Simulate loading delay
    setTimeout(() => {
      this.orderDetail.set(mockOrder);
      this.isLoading.set(false);
    }, 1000);
  }

  getFullUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = this.environment.api.replace('/api', '');
    return `${baseUrl}/storage/${path}`;
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: 'warn',
      confirmed: 'accent',
      completed: 'primary',
    };
    return colorMap[status] || 'primary';
  }

  onConfirmPayment() {
    const offerId = this.route.snapshot.paramMap.get('offerId');
    const buyerId = this.route.snapshot.paramMap.get('buyerId');

    if (offerId && buyerId) {
      this.http
        .post(`${environment.api}/offers/${offerId}/buyers/${buyerId}/confirm`, {})
        .subscribe({
          next: () => {
            const order = this.orderDetail();
            if (order) {
              order.order.status = 'confirmed';
              this.orderDetail.set({ ...order });
            }
          },
          error: (err) => {
            // For mock data, just update the status locally
            const order = this.orderDetail();
            if (order) {
              order.order.status = 'confirmed';
              this.orderDetail.set({ ...order });
            }
            console.warn('API not available, simulating confirmation');
          },
        });
    }
  }

  toggleStatus() {
    const order = this.orderDetail();
    if (order) {
      const statuses: ('pending' | 'confirmed' | 'completed')[] = ['pending', 'confirmed', 'completed'];
      const currentIndex = statuses.indexOf(order.order.status);
      const nextIndex = (currentIndex + 1) % statuses.length;
      order.order.status = statuses[nextIndex];
      this.orderDetail.set({ ...order });
    }
  }

  showProofPopup = signal(false);

  onViewPaymentProof() {
    this.showProofPopup.set(true); 
  }

  closePopup() {
    this.showProofPopup.set(false);
  }
}
