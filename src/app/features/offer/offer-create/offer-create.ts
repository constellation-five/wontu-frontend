import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header';
// import { PaneComponent } from '../../../shared/components/pane/pane';

@Component({
  selector: 'offer-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    PageHeaderComponent,
    // PaneComponent
  ],
  templateUrl: './offer-create.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OfferCreate {
  private fb = inject(FormBuilder);

  isLoading = signal<boolean>(false);
  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Offers', route: '/offer' },
    { label: 'Create Offer' }
  ]);
}