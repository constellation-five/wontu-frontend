import { ChangeDetectionStrategy, Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PaymentMethodCard } from '../../shared/components/payment-method-card/payment-method-card';
import {
  PaymentMethodFormDialog,
  PaymentMethodFormDialogData,
} from '../../shared/components/payment-method-form-dialog/payment-method-form-dialog';
import { PaneComponent } from '../../shared/components/pane/pane';
import { PageHeaderService } from '../../core/page-header.service';
import { ButtonSizeDirective, ButtonColorDirective } from '../../shared/directives/button';
import { BREAKPOINTS } from '../../core/constants';

export interface PaymentMethodData {
  payment_method_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
}

@Component({
  selector: 'payment-method-page',
  standalone: true,
  imports: [
    MatButtonModule,
    CommonModule,
    MatIconModule,
    PaymentMethodCard,
    PaneComponent,
    ButtonSizeDirective,
    ButtonColorDirective,
  ],
  templateUrl: './payment-method-page.html',
  styleUrl: './payment-method-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethod implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private pageHeader = inject(PageHeaderService);
  private router = inject(Router);

  paymentMethods = signal<PaymentMethodData[]>([]);
  isLoading = signal(true);
  isMobile = signal(false);

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.pageHeader.setTitle('Payment Methods');
    this.fetchPaymentMethods();
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile.set(window.innerWidth <= BREAKPOINTS.MD);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  fetchPaymentMethods() {
    this.http.get<any>(`${environment.api}/payment-methods`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.paymentMethods.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openAddModal() {
    this.openMethodDialog();
  }

  openEditModal(method: PaymentMethodData) {
    this.openMethodDialog(method);
  }

  private openMethodDialog(method?: PaymentMethodData) {
    const dialogRef = this.dialog.open<
      PaymentMethodFormDialog,
      PaymentMethodFormDialogData,
      PaymentMethodData | 'deleted'
    >(PaymentMethodFormDialog, {
      width: this.isMobile() ? '370px' : '540px',
      data: { method },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.fetchPaymentMethods();
      }
    });
  }
}
