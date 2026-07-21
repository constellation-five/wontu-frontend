import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ButtonSizeDirective } from '../../../directives/button';
import { AuthService } from '../../../../core/auth.service';
import { ChatService } from '../../../../core/chat.service';
import { DialogComponent } from '../dialog';

interface UserProfile {
  user_id: string;
  username: string;
  name: string;
  avatar: string | null;
  followers_count: number;
  following_count: number;
  average_rating: number;
  total_ratings: number;
  is_following: boolean;
  is_following_back: boolean;
}

interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

@Component({
  selector: 'user-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ButtonSizeDirective,
    DialogComponent,
  ],
  templateUrl: './user-profile-dialog.html',
  styleUrl: './user-profile-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileDialog implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private dialogRef = inject(MatDialogRef<UserProfileDialog>);
  data = inject<{ userId: string }>(MAT_DIALOG_DATA);

  profile = signal<UserProfile | null>(null);
  isLoading = signal(true);
  isProcessing = signal(false);
  isOpeningChat = signal(false);

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.http
      .get<UserProfileResponse>(`${environment.api}/profile/${this.data.userId}`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.profile.set(res.data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.dialogRef.close();
        },
      });
  }

  toggleFollow() {
    const profile = this.profile();
    if (!profile || this.isProcessing()) return;

    this.isProcessing.set(true);

    const request$ = profile.is_following
      ? this.http.delete(`${environment.api}/profile/${profile.user_id}/unfollow`, {
          withCredentials: true,
        })
      : this.http.post(
          `${environment.api}/profile/${profile.user_id}/follow`,
          {},
          { withCredentials: true },
        );

    request$.subscribe({
      next: () => {
        // Reload profile to get updated data including is_following_back status
        this.loadProfile();
        this.isProcessing.set(false);

        // Dispatch event to refresh parent list
        window.dispatchEvent(new CustomEvent('profile-updated'));
      },
      error: () => this.isProcessing.set(false),
    });
  }

  close() {
    this.dialogRef.close();
  }

  openChat() {
    const profile = this.profile();
    if (!profile || this.isOpeningChat()) return;

    if (profile.user_id === this.authService.user()?.user_id) {
      this.dialogRef.close();
      this.router.navigate(['/profile']);
      return;
    }

    this.isOpeningChat.set(true);
    this.chatService.findOrCreatePrivateConversation(profile.user_id).subscribe({
      next: (conversation) => {
        this.dialogRef.close();
        this.router.navigate(['/chat', conversation.id]);
      },
      error: () => this.isOpeningChat.set(false),
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }
}
