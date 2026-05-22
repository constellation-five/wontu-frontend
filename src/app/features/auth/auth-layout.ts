import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaneComponent } from '../../shared/components/pane/pane';

@Component({
  selector: 'auth-layout',
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
  imports: [PaneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthLayout {}
