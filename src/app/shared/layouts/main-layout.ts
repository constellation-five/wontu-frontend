import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DesktopNavbar } from '../components/desktop-navbar';

@Component({
  selector: 'main-layout',
  template: `
    <div class="min-h-dvh md:flex md:bg-(--mat-sys-background)">
      <aside class="hidden md:block md:w-56 md:shrink-0">
        <desktop-navbar />
      </aside>

      <main class="min-w-0 flex-1 flex flex-col">
        <router-outlet />
      </main>
    </div>
  `,
  imports: [RouterOutlet, DesktopNavbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {}
