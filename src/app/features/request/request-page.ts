import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'request-page',
  templateUrl: './request-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestPage {}
