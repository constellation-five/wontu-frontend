import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-segmented-control',
  template: `
    <div class="segmented-control">
      @for (option of options(); track option) {
        <button 
          mat-button
          class="segment-btn mat-font-label-lg" 
          [class.active]="option === value()" 
          (click)="onSelect(option)">
          {{ option }}
        </button>
      }
    </div>
  `,
  styleUrls: ['./segmented-control.scss'],
  standalone: true,
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControlComponent {
  options = input.required<string[]>();
  value = input.required<string>();
  valueChange = output<string>();

  onSelect(option: string) {
    if (option !== this.value()) {
      this.valueChange.emit(option);
    }
  }
}
