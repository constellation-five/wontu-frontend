import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DialogButton {
  label: string;
  icon?: string;
  type: 'filled' | 'outlined' | 'tonal'; // Material button types
  action: string; // identifier untuk button action
  // Color customization
  bgColor?: string; // background color for filled/tonal
  textColor?: string; // text color
  borderColor?: string; // border color for outlined
}

export interface DialogData {
  title: string;
  content: string; // bisa HTML
  buttons: DialogButton[];
}

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './dialog.html',
  styleUrls: ['./dialog.scss']
})
export class DialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onButtonClick(action: string) {
    this.dialogRef.close(action);
  }
}
