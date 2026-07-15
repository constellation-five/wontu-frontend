import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SearchBarComponent } from '../search-bar/search-bar';
import { NotificationBellComponent } from '../notification-bell/notification-bell';
import { ButtonSizeDirective } from '../../directives/button/button-size';

@Component({
  selector: 'app-main-page-header',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    SearchBarComponent,
    NotificationBellComponent,
    ButtonSizeDirective,
  ],
  templateUrl: './main-page-header.html',
  styleUrl: './main-page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageHeaderComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  pageTitle = input.required<string>();
  location = input<string>('');
  searchValue = input('');
  searchPlaceholder = input('Search');

  locationClick = output<void>();
  searchValueChange = output<string>();

  protected readonly stuck = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const searchFilterRow = this.elementRef.nativeElement.querySelector('.search-filter-row');
    if (!searchFilterRow) {
      return;
    }

    const top = searchFilterRow.getBoundingClientRect().top;
    this.stuck.set(top <= 0);
  }
}
