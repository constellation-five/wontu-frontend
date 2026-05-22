import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderService } from '../../../core/page-header.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-header.html',
  styleUrls: ['./page-header.scss'],
})
export class PageHeaderComponent {
  pageHeaderService = inject(PageHeaderService);
}
