import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-category-label',
  templateUrl: './category-label.html',
  styleUrls: ['./category-label.scss'],
  standalone: true,
  imports: [NgClass, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryLabelComponent {
  category = input.required<string>();

  get categoryClass(): string {
    return 'cat-' + this.category().toLowerCase();
  }
}
