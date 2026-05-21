import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { PageHeaderService } from '../../../core/page-header.service';
import { ButtonSizeDirective } from '../../directives/button';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="top-bar" [class.scrolled]="scrolled()">
      <button matIconButton class="back-btn" (click)="onBack()">
        <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
      </button>
      <div class="title" *ngIf="showCollapsedTitle()">{{ collapsedTitle() }}</div>
    </div>
  `,
  styleUrls: ['./top-bar.scss'],
})
export class TopBarComponent {
  private router = inject(Router);
  pageHeader = inject(PageHeaderService);

  scrolled = signal(false);

  collapsedTitle = signal('');

  constructor() {
    // derive collapsed title from breadcrumbs
    const crumbs = this.pageHeader.breadcrumbs();
    if (crumbs.length > 0) {
      this.collapsedTitle.set(crumbs[crumbs.length - 1].label);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled.set(window.scrollY > 56);
  }

  showCollapsedTitle() {
    return this.scrolled() && !!this.collapsedTitle();
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
}
