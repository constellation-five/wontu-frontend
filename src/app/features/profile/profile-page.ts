import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'profile-page',
  templateUrl: './profile-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {}
