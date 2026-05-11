import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header';
import { OfferService } from '../../../core/offer.service';
import { Offer } from '../../../core/offer';

@Component({
  selector: 'offer-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    PageHeaderComponent
  ],
  templateUrl: './offer-chat.html',
  styleUrls: ['./offer-chat.scss'],
})
export class OfferChatPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offerService = inject(OfferService);

  offer = signal<Offer | null>(null);
  isLoading = signal<boolean>(true);
  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Offers', route: '/offer' },
    { label: 'Loading...' }
  ]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOffer(id);
    } else {
      this.router.navigate(['/offer']);
    }
  }

  loadOffer(id: string) {
    this.isLoading.set(true);
    this.offerService.getOfferById(id).subscribe({
      next: (data) => {
        this.offer.set(data);
        this.breadcrumbs.set([
          { label: 'Offers', route: '/offer' },
          { label: data.merchant_name, route: `/offer/${data.offer_id}` },
          { label: 'Chat' }
        ]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load offer:', err);
        this.isLoading.set(false);
        this.router.navigate(['/offer']);
      }
    });
  }
}
