import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'history-page',
  templateUrl: './history-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPage {}
