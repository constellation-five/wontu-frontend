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

interface Following {
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
}

interface FollowingResponse {
  success: boolean;
  message: string;
  data: Following[];
}

@Component({
  selector: 'following-page',
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
  templateUrl: './following-page.html',
  styleUrl: './following-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowingPage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  following = signal<Following[]>([]);
  filteredFollowing = signal<Following[]>([]);
  searchQuery = signal('');
  isLoading = signal(true);
  isMobile = signal(false);
  
  private profileUpdatedListener = () => this.fetchFollowing();

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
    this.fetchFollowing();
    
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

  fetchFollowing() {
    const userId = this.authService.user()?.user_id;
    if (!userId) return;

    this.http
      .get<FollowingResponse>(`${environment.api}/profile/${userId}/following`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.following.set(res.data);
          this.filteredFollowing.set(res.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.filteredFollowing.set(this.following());
      return;
    }

    const filtered = this.following().filter((user) =>
      user.name.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredFollowing.set(filtered);
  }

  unfollow(user: Following) {
    this.http
      .delete(`${environment.api}/profile/${user.user_id}/unfollow`, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          this.following.update((following) =>
            following.filter((f) => f.user_id !== user.user_id)
          );
          this.onSearchChange(this.searchQuery());
          // Trigger parent profile page to refresh stats
          window.dispatchEvent(new CustomEvent('profile-updated'));
        },
      });
  }

  navigateToProfile(userId: string) {
    this.dialog.open(UserProfileDialog, {
      data: { userId },
      panelClass: 'user-profile-dialog-panel',
    });
  }
}
