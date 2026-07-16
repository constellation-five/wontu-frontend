import { Component, inject, input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonColorDirective } from '../../directives/button/button-color';

export interface DialogButton {
  label: string;
  icon?: string;
  type: 'filled' | 'outlined' | 'tonal';
  action?: string | (() => void);
  color?: 'primary' | 'error';
  focus?: boolean;
  disabled?: boolean;
}

export interface DialogData {
  title?: string;
  content?: string; // bisa HTML
  buttons?: DialogButton[];
  showClose?: boolean;
}

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ButtonColorDirective],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class DialogComponent {
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly title = input<string>();
  readonly buttons = input<DialogButton[]>();
  readonly showClose = input<boolean>();

  get resolvedTitle(): string {
    return this.title() ?? this.data?.title ?? '';
  }

  get resolvedButtons(): DialogButton[] {
    return this.buttons() ?? this.data?.buttons ?? [];
  }

  get content(): string | undefined {
    return this.data?.content;
  }

  get resolvedShowClose(): boolean {
    return this.showClose() ?? this.data?.showClose ?? false;
  }

  isCallback(action: DialogButton['action']): action is () => void {
    return typeof action === 'function';
  }

  invoke(action: () => void): void {
    action();
  }
}
