import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'app-ongoing-section',
  standalone: true,
  templateUrl: './ongoing-section.html',
  styleUrl: './ongoing-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OngoingSection {
  title = input<string>('Ongoing');
}