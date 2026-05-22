import { Component, ChangeDetectionStrategy, model, input, booleanAttribute } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonSizeDirective } from '../../directives/button';

@Component({
  selector: 'app-counter-field',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ButtonSizeDirective,
  ],
  templateUrl: './counter-field.html',
  styleUrls: ['./counter-field.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-compact]': 'compact()',
  },
})
export class CounterField {
  compact = input(false, { transform: booleanAttribute });
  label = input<string>('');
  value = model<number>(1);
  min = input<number | null>(null);
  max = input<number | null>(null);

  increment() {
    const current = this.value();
    const maximum = this.max();
    if (maximum === null || current < maximum) {
      this.value.set(current + 1);
    }
  }

  decrement() {
    const current = this.value();
    const minimum = this.min();
    if (minimum === null || current > minimum) {
      this.value.set(current - 1);
    }
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    let newValue = parseInt(target.value, 10);

    if (isNaN(newValue)) {
      // Revert to old value if invalid
      target.value = this.value().toString();
      return;
    }

    const minimum = this.min();
    const maximum = this.max();

    if (minimum !== null && newValue < minimum) newValue = minimum;
    if (maximum !== null && newValue > maximum) newValue = maximum;

    this.value.set(newValue);
    target.value = newValue.toString();
  }
}
