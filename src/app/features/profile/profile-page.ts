import { ChangeDetectionStrategy, Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageHeaderService } from '../../core/page-header.service';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { DialogComponent } from '../../shared/components/dialog/dialog';
import { RatingDialog } from './rating/rating-dialog';
import { BREAKPOINTS } from '../../core/constants';

interface UserProfile {
  user_id: string;
  username: string;
  name: string;
  avatar: string | null;
  followers_count: number;
  following_count: number;
  average_rating: number;
  total_ratings: number;
}

interface ProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

@Component({
  selector: 'profile-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    RouterModule,
    RouterOutlet,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private http = inject(HttpClient);
  private pageHeader = inject(PageHeaderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  profile = signal<UserProfile | null>(null);
  isLoading = signal(true);
  currentRoute = signal('account');
  isMobile = signal(false);

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.pageHeader.setTitle('Profile');
    this.fetchProfile();
    this.checkMobile();
    
    // Handle initial route based on device
    const url = this.router.url;
    if ((url === '/profile' || url === '/profile/') && this.isMobile()) {
      // Mobile at root: stay at root, don't navigate to account
      this.currentRoute.set('none');
    } else {
      this.updateCurrentRoute();
    }
    
    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCurrentRoute();
      });

    // Listen to profile updates from child components
    window.addEventListener('profile-updated', () => {
      this.fetchProfile();
    });
  }

  checkMobile() {
    this.isMobile.set(window.innerWidth <= BREAKPOINTS.MD);
  }

  updateCurrentRoute() {
    const url = this.router.url;
    if (url.includes('/payment-method')) {
      this.currentRoute.set('payment');
    } else if (url.includes('/settings')) {
      this.currentRoute.set('settings');
    } else if (url.includes('/followers') || url.includes('/following')) {
      this.currentRoute.set('other');
    } else if (url.includes('/account')) {
      this.currentRoute.set('account');
    } else if (url === '/profile' || url === '/profile/') {
      // At root profile path
      if (this.isMobile()) {
        // Mobile: show menu only
        this.currentRoute.set('none');
      } else {
        // Desktop: show account (will be loaded by child route)
        this.currentRoute.set('account');
      }
    } else {
      this.currentRoute.set('account');
    }
  }

  shouldShowContent(): boolean {
    // Desktop: always show content
    // Mobile: hide when at root (showing menu), show when in subpage
    if (!this.isMobile()) {
      return true;
    }
    return this.currentRoute() !== 'none';
  }

  fetchProfile() {
    const userId = this.authService.user()?.user_id;
    if (!userId) return;

    this.http.get<ProfileResponse>(`${environment.api}/profile/${userId}`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  navigateToSubpage(route: string) {
    if (route === '') {
      // Account button clicked
      if (this.isMobile()) {
        // Mobile: navigate to explicit account route
        this.router.navigate(['/profile/account']);
      } else {
        // Desktop: navigate to root (will load account via default child route)
        this.router.navigate(['/profile']);
      }
    } else {
      // Other subpages
      this.router.navigate([`/profile/${route}`]);
    }
  }

  logout() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '540px',
      data: {
        title: 'Sign out',
        content: 'Are you sure you want to Sign out?',
        buttons: [
          {
            label: 'Cancel',
            type: 'outlined',
            action: 'cancel'
          },
          {
            label: 'Sign out',
            icon: 'logout',
            type: 'filled',
            action: 'logout',
            color: 'error'
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'logout') {
        this.authService.logout().subscribe({
          next: () => {
            this.router.navigate(['/signin']);
          },
        });
      }
    });
  }

  openRatingDialog() {
    this.dialog.open(RatingDialog, {
      width: '510px',
      maxWidth: '90vw',
      panelClass: 'rating-dialog-panel',
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
