import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-category-label',
  templateUrl: './category-label.html',
  styleUrls: ['./category-label.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryLabelComponent {
  category = input.required<string>();
}
