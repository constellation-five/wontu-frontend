import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonColorDirective } from '../../directives/button/button-color';

export interface DialogButton {
  label: string;
  icon?: string;
  type: 'filled' | 'outlined' | 'tonal'; // Material button appearance
  action?: string;
  color?: 'primary' | 'error';
  focus?: boolean; // gets initial focus via cdkFocusInitial
}

export interface DialogData {
  title: string;
  content: string; // bisa HTML
  buttons: DialogButton[];
}

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ButtonColorDirective],
  templateUrl: './dialog.html',
})
export class DialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}
}
