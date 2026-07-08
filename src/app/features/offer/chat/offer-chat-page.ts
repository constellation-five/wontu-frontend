import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PageHeaderService } from '../../../core/page-header.service';
import { OfferService } from '../../../core/offer.service';
import { Offer } from '../../../core/offer.service';

@Component({
  selector: 'offer-chat-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './offer-chat-page.html',
  styleUrls: ['./offer-chat-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferChatPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offerService = inject(OfferService);
  private readonly pageHeaderService = inject(PageHeaderService);

  offer = signal<Offer | null>(null);
  isLoading = signal<boolean>(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOffer(id);
    } else {
      this.router.navigate(['/offers']);
    }
  }

  loadOffer(id: string) {
    this.isLoading.set(true);
    this.offerService.getOfferById(id).subscribe({
      next: (data) => {
        this.offer.set(data);

        this.pageHeaderService.setBreadcrumbs([
          { label: 'Offers', route: '/offers' },
          { label: data.merchant_name, route: `/offers/${data.offer_id}` },
          { label: 'Chat' },
        ]);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offers']);
      },
    });
  }
}
