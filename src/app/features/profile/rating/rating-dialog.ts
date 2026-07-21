import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth.service';

interface RatingBreakdown {
  stars: number;
  count: number;
  percentage: number;
}

interface RatingData {
  average_rating: number;
  total_ratings: number;
  breakdown: RatingBreakdown[];
}

interface RatingResponse {
  success: boolean;
  message: string;
  data: RatingData;
}

@Component({
  selector: 'rating-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './rating-dialog.html',
  styleUrl: './rating-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingDialog {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<RatingDialog>);

  ratingData = signal<RatingData | null>(null);
  isLoading = signal(true);

  // Expose Math to template
  Math = Math;

  constructor() {
    this.fetchRatingBreakdown();
  }

  fetchRatingBreakdown() {
    const userId = this.authService.user()?.user_id;
    if (!userId) return;

    this.http
      .get<RatingResponse>(`${environment.api}/profile/${userId}/rating-breakdown`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.ratingData.set(res.data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  getStarArray(count: number): number[] {
    return Array(count).fill(0);
  }

  close() {
    this.dialogRef.close();
  }
}
