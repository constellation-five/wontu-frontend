import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NaturalDateTimePipe } from '../../pipes/natural-date-time.pipe';

export interface TimelineItem {
  label: string;
  time?: string | Date;
}

@Component({
  selector: 'app-timeline-bar',
  standalone: true,
  imports: [CommonModule, NaturalDateTimePipe],
  templateUrl: './timeline-bar.html',
  styleUrls: ['./timeline-bar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineBar {
  items = input.required<TimelineItem[]>();
  currentStep = input<number>(0);

  isCompleted(index: number): boolean {
    return index < this.currentStep();
  }

  isActive(index: number): boolean {
    return index === this.currentStep();
  }
}
