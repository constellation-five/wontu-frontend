import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog';
import { PageHeaderService } from '../../../core/page-header.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink, MatDialogModule],
  templateUrl: './page-header.html',
  styleUrls: ['./page-header.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  pageHeaderService = inject(PageHeaderService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  onBreadcrumbClick(event: MouseEvent, item: { label: string; route?: string }) {
    if (!item.route || !this.shouldConfirmStoreNavigation(item)) {
      return;
    }

    event.preventDefault();
    this.dialog.closeAll();

    const dialogRef = this.dialog.open(DialogComponent, {
      width: '520px',
      data: {
        title: 'Leave This Order?',
        content:
          'Your current order will be saved to the History page. You can continue it there anytime.',
        buttons: [
          {
            label: 'Stay',
            type: 'outlined',
            action: 'cancel',
          },
          {
            label: 'Go to History',
            type: 'filled',
            action: 'confirm',
          },
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.router.navigate(['/history']);
      }
    });
  }

  private shouldConfirmStoreNavigation(item: { label: string; route?: string }) {
    // Only show confirmation dialog if currently on checkout page
    const currentUrl = this.router.url;
    const isOnCheckoutPage = currentUrl.includes('/checkout');
    const isNavigatingToStore = item.route?.startsWith('/offers/') && 
                                 !item.route?.includes('/checkout') && 
                                 item.label !== 'Offers';
    
    return isOnCheckoutPage && isNavigatingToStore;
  }
}
