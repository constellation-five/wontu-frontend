import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { PageHeaderService } from '../../../core/page-header.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
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
  pageHeader = inject(PageHeaderService);

  scrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled.set(window.scrollY > 80);
  }

  onBack() {
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
