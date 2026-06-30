import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageHeaderService } from '../../../core/page-header.service';
import { MatMenuModule } from '@angular/material/menu';
import { DialogComponent } from '../dialog/dialog';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatDialogModule],
  template: `
    <div class="top-bar" [class.scrolled]="scrolled()">
      <button matIconButton class="back-btn" (click)="onBack()">
        <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
      </button>
      <div class="title">{{ pageHeader.title() }}</div>
      @if (pageHeader.menuItems().length > 0) {
        <button matIconButton class="menu-btn" [matMenuTriggerFor]="menu">
          <mat-icon fontSet="material-symbols-outlined">more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          @for (item of pageHeader.menuItems(); track item.label) {
            <button mat-menu-item (click)="item.action()">{{ item.label }}</button>
          }
        </mat-menu>
      }
    </div>
  `,
  styleUrls: ['./top-bar.scss'],
})
export class TopBarComponent {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  pageHeader = inject(PageHeaderService);

  scrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled.set(window.scrollY > 80);
  }

  onBack() {
    const currentUrl = this.router.url;
    const isOnCheckoutPage = currentUrl.includes('/checkout');

    // Show confirmation dialog if on checkout page
    if (isOnCheckoutPage) {
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
      return;
    }

    // Normal back navigation
    const crumbs = this.pageHeader.breadcrumbs();
    if (crumbs.length > 1) {
      const prev = crumbs[crumbs.length - 2].route || '/';
      this.router.navigateByUrl(prev);
    } else {
      this.router.navigateByUrl('/');
    }
  }

  onMenu() {
    // Handle menu button click
  }
}
