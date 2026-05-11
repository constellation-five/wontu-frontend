import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'edit-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './edit-notes-dialog.html',
  styleUrls: ['./edit-notes-dialog.scss']
})
export class EditNotesDialog {
  private readonly dialogRef = inject(MatDialogRef<EditNotesDialog>);
  private readonly data = inject<{ notes: string }>(MAT_DIALOG_DATA);
  notes: string = this.data?.notes || '';

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.notes);
  }
}