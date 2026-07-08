import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageHeaderService } from '../../../core/page-header.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './page-header.html',
  styleUrls: ['./page-header.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  pageHeaderService = inject(PageHeaderService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  onBreadcrumbClick(event: MouseEvent, item: { label: string; route?: string }) {
    if (!item.route) {
      return;
    }

    // Let the browser handle modifier-key clicks (open in new tab, etc.) natively.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
      return;
    }

    event.preventDefault();

    this.router.navigateByUrl(item.route);
  }
}
