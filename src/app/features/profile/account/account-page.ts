import { ChangeDetectionStrategy, Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { ButtonSizeDirective, ButtonColorDirective } from '../../../shared/directives/button';
import { AuthService } from '../../../core/auth.service';
import { PageHeaderService } from '../../../core/page-header.service';
import { BREAKPOINTS } from '../../../core/constants';

interface PersonalInfo {
  user_id: string;
  username: string;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

interface PersonalInfoResponse {
  success: boolean;
  message: string;
  data: PersonalInfo;
}

@Component({
  selector: 'account-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    PaneComponent,
    ButtonSizeDirective,
    ButtonColorDirective,
  ],
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPage implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private pageHeader = inject(PageHeaderService);
  private router = inject(Router);

  personalInfo = signal<PersonalInfo | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isEditingUsername = signal(false);
  isEditingName = signal(false);
  isMobile = signal(false);

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    username: ['', [Validators.required, Validators.maxLength(64)]],
  });

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.pageHeader.setTitle('Account');
    this.pageHeader.setBreadcrumbs([
      { label: 'Profile', route: '/profile' },
      { label: 'Account', route: '/profile/account' },
    ]);
    this.fetchPersonalInfo();
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile.set(window.innerWidth <= BREAKPOINTS.MD);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  fetchPersonalInfo() {
    this.http.get<PersonalInfoResponse>(`${environment.api}/profile/personal-info`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.personalInfo.set(res.data);
        this.profileForm.patchValue({
          name: res.data.name,
          username: res.data.username,
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    
    this.isSaving.set(true);
    const data: any = {};
    
    // Only send fields that are being edited
    if (this.isEditingName()) {
      data.name = this.profileForm.value.name;
    }
    if (this.isEditingUsername()) {
      data.username = this.profileForm.value.username;
    }

    this.http.put<PersonalInfoResponse>(`${environment.api}/profile`, data, { withCredentials: true }).subscribe({
      next: (res) => {
        this.personalInfo.set(res.data);
        this.isSaving.set(false);
        this.isEditingUsername.set(false);
        this.isEditingName.set(false);
        
        // Show success snackbar
        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 3000,
        });
        
        // Reload auth user data to update sidebar, then dispatch event
        this.authService.loadUser().subscribe(() => {
          // Dispatch event to notify profile page to refresh
          window.dispatchEvent(new Event('profile-updated'));
        });
      },
      error: () => this.isSaving.set(false),
    });
  }

  enableNameEdit() {
    this.isEditingName.set(true);
  }

  cancelNameEdit() {
    this.isEditingName.set(false);
    this.profileForm.patchValue({
      name: this.personalInfo()?.name,
    });
  }

  enableUsernameEdit() {
    this.isEditingUsername.set(true);
  }

  cancelUsernameEdit() {
    this.isEditingUsername.set(false);
    this.profileForm.patchValue({
      username: this.personalInfo()?.username,
    });
  }

  formatDate(dateString: string): string {
    // Backend already returns formatted date, just return it
    return dateString;
  }
}
