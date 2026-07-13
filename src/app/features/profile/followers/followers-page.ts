import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { AuthService } from '../../../core/auth.service';
import { ButtonSizeDirective } from '../../../shared/directives/button/button-size';
import { UserProfileDialog } from '../../../shared/components/dialog/user-profile-dialog';
import { BREAKPOINTS } from '../../../core/constants';

interface Follower {
  user_id: string;
  username: string;
  name: string;
  avatar: string | null;
  mutual_count: number;
  mutual_friends: Array<{
    user_id: string;
    username: string;
    name: string;
    avatar: string | null;
  }>;
  is_following: boolean;
}

interface FollowersResponse {
  success: boolean;
  message: string;
  data: Follower[];
}

@Component({
  selector: 'followers-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    FormsModule,
    PaneComponent,
    ButtonSizeDirective,
  ],
  templateUrl: './followers-page.html',
  styleUrl: './followers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowersPage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  followers = signal<Follower[]>([]);
  filteredFollowers = signal<Follower[]>([]);
  searchQuery = signal('');
  isLoading = signal(true);
  isMobile = signal(false);
  
  private profileUpdatedListener = () => this.fetchFollowers();

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
    this.fetchFollowers();
    
    // Listen for profile updates from dialog
    window.addEventListener('profile-updated', this.profileUpdatedListener);
  }
  
  ngOnDestroy() {
    window.removeEventListener('profile-updated', this.profileUpdatedListener);
  }

  checkMobile() {
    this.isMobile.set(window.innerWidth <= BREAKPOINTS.MD);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  fetchFollowers() {
    const userId = this.authService.user()?.user_id;
    if (!userId) return;

    this.http
      .get<FollowersResponse>(`${environment.api}/profile/${userId}/followers`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.followers.set(res.data);
          this.filteredFollowers.set(res.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.filteredFollowers.set(this.followers());
      return;
    }

    const filtered = this.followers().filter((follower) =>
      follower.name.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredFollowers.set(filtered);
  }

  toggleFollow(follower: Follower) {
    if (follower.is_following) {
      this.http
        .delete(`${environment.api}/profile/${follower.user_id}/unfollow`, {
          withCredentials: true,
        })
        .subscribe({
          next: () => {
            // Update local state
            this.followers.update((followers) =>
              followers.map((f) =>
                f.user_id === follower.user_id ? { ...f, is_following: false } : f
              )
            );
            this.onSearchChange(this.searchQuery());
            // Refetch to get updated mutual counts
            this.fetchFollowers();
            // Trigger parent profile page to refresh stats
            window.dispatchEvent(new CustomEvent('profile-updated'));
          },
        });
    } else {
      this.http
        .post(
          `${environment.api}/profile/${follower.user_id}/follow`,
          {},
          { withCredentials: true }
        )
        .subscribe({
          next: () => {
            // Update local state
            this.followers.update((followers) =>
              followers.map((f) =>
                f.user_id === follower.user_id ? { ...f, is_following: true } : f
              )
            );
            this.onSearchChange(this.searchQuery());
            // Refetch to get updated mutual counts
            this.fetchFollowers();
            // Trigger parent profile page to refresh stats
            window.dispatchEvent(new CustomEvent('profile-updated'));
          },
        });
    }
  }

  navigateToProfile(userId: string) {
    this.dialog.open(UserProfileDialog, {
      data: { userId },
      panelClass: 'user-profile-dialog-panel',
    });
  }
}
