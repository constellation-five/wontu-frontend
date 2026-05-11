import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './page-header.html',
  styleUrls: ['./page-header.scss']
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() isLoading: boolean = false;
}
