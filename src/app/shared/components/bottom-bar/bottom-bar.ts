import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BottomBarService } from '../../../core/bottom-bar.service';
import { PortalModule } from '@angular/cdk/portal';

@Component({
  selector: 'app-bottom-bar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, PortalModule],
  template: `
    @if (bottomBar.portal()) {
      <div class="bottom-app-bar">
        <ng-template [cdkPortalOutlet]="bottomBar.portal()"></ng-template>
      </div>
    }
  `,
  styleUrls: ['./bottom-bar.scss'],
})
export class BottomBar {
  bottomBar = inject(BottomBarService);
}
