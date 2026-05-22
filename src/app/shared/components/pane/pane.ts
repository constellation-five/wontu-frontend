import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-pane',
  templateUrl: './pane.html',
  styleUrls: ['./pane.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pane]': 'true',
    '[class.pane-large]': 'isLarge()',
  },
})
export class PaneComponent {
  title = input<string>('');
  isLarge = input(false, { transform: booleanAttribute });
}
