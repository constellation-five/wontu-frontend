import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DialogButton, DialogComponent } from '../../../shared/components/dialog/dialog';

@Component({
  selector: 'edit-notes-dialog',
  standalone: true,
  imports: [DialogComponent, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './edit-notes-dialog.html',
  styleUrl: './edit-notes-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditNotesDialog {
  private readonly dialogRef = inject(MatDialogRef<EditNotesDialog>);
  private readonly data = inject<{ notes: string }>(MAT_DIALOG_DATA);
  notes: string = this.data?.notes || '';

  readonly buttons: DialogButton[] = [
    { label: $localize`Cancel`, type: 'outlined', action: () => this.dialogRef.close() },
    { label: $localize`Save`, type: 'filled', focus: true, action: () => this.dialogRef.close(this.notes) },
  ];
}
