import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ChatParticipant } from '../../../core/chat.service';
import { ChatInformationPane } from '../chat-information-pane/chat-information-pane';
import { UserProfileDialog } from '../../../shared/components/dialog/user-profile-dialog';

export interface ChatInfoDialogData {
  owner: Omit<ChatParticipant, 'role' | 'left_at'> | null;
  participants: ChatParticipant[];
}

/** Presents ChatInformationPane inside a MatDialog — used for the mobile group-chat "i" button. */
@Component({
  selector: 'chat-info-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ChatInformationPane],
  templateUrl: './chat-info-dialog.html',
  styleUrl: './chat-info-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInfoDialog {
  private readonly dialogRef = inject(MatDialogRef<ChatInfoDialog>);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly data = inject<ChatInfoDialogData>(MAT_DIALOG_DATA);

  onMemberClick(userId: string): void {
    this.dialogRef.close();

    if (userId === this.authService.user()?.user_id) {
      this.router.navigate(['/profile']);
      return;
    }

    this.dialog.open(UserProfileDialog, {
      width: '348px',
      data: { userId },
    });
  }
}
