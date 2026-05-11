import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pane.html',
  host: {'class': 'block w-full'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaneComponent {
  @Input() title: string = '';
}