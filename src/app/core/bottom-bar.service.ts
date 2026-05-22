import { Injectable, signal } from '@angular/core';
import { Portal } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root',
})
export class BottomBarService {
  portal = signal<Portal<any> | null>(null);
}
