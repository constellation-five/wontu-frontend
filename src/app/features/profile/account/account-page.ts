import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    username: ['', [Validators.required, Validators.maxLength(64)]],
  });



  ngOnInit() {
    this.pageHeader.setTitle($localize`Account`);
    this.pageHeader.setBreadcrumbs([
      { label: $localize`Profile`, route: '/profile' },
      { label: $localize`Account`, route: '/profile/account' },
    ]);
    this.fetchPersonalInfo();
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
        this.snackBar.open($localize`Profile updated successfully.`, $localize`Close`, {
          duration: 3000,
        });
        
        // Reload auth user data to update sidebar, then dispatch event
        this.authService.loadUser().subscribe(() => {
          // Dispatch event to notify profile page to refresh
          window.dispatchEvent(new Event('profile-updated'));
        });
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open(`Failed to update profile: ${msg}${status}`, $localize`Close`, { duration: 5000 });
      },
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
