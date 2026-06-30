import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.scss'],
  standalone: true,
  imports: [MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  placeholder = input<string>('Search');
  value = input<string>('');
  searchChange = output<string>();

  searchValue = signal<string>('');

  constructor() {
    effect(() => {
      this.searchValue.set(this.value());
    });
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchValue.set(target.value);
    this.searchChange.emit(target.value);
  }

  get isFilled(): boolean {
    return this.searchValue().length > 0;
  }
}
