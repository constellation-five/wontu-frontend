import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

export type TransitionDirection = 'forward' | 'backward' | 'fade';

@Injectable({ providedIn: 'root' })
export class TransitionDirectionService {
  private router = inject(Router);
  
  private navigationHistory: string[] = [];
  currentDirection: TransitionDirection = 'fade';

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.determineDirection(event);
      }
    });
  }

  private determineDirection(event: NavigationStart) {
    document.documentElement.classList.remove('vt-forward', 'vt-backward', 'vt-fade');

    // If popstate, we assume it's a back navigation (unless they clicked forward in browser,
    // which is hard to distinguish without complex history tracking, but backward is a safe default).
    if (event.navigationTrigger === 'popstate') {
      this.currentDirection = 'backward';
      this.navigationHistory.pop();
      document.documentElement.classList.add('vt-backward');
      return;
    }

    const currentUrl = this.router.url.split('?')[0];
    const nextUrl = event.url.split('?')[0];
    
    const currentDepth = currentUrl === '/' ? 0 : currentUrl.split('/').length - 1;
    const nextDepth = nextUrl === '/' ? 0 : nextUrl.split('/').length - 1;

    if (nextDepth > currentDepth) {
      this.currentDirection = 'forward';
      document.documentElement.classList.add('vt-forward');
    } else if (nextDepth < currentDepth) {
      this.currentDirection = 'backward';
      document.documentElement.classList.add('vt-backward');
    } else {
      this.currentDirection = 'fade';
      document.documentElement.classList.add('vt-fade');
    }

    this.navigationHistory.push(currentUrl);
  }
}
