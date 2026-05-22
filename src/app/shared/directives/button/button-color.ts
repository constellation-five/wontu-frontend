import { Directive, ElementRef, Renderer2, inject, input, effect } from '@angular/core';

export type ButtonColor = 'primary' | 'error';

@Directive({
  selector: '[appButtonColor]',
  standalone: true,
})
export class ButtonColorDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  appButtonColor = input<ButtonColor>('primary');

  constructor() {
    effect(() => {
      const color = this.appButtonColor();
      // Remove old color classes
      this.renderer.removeClass(this.el.nativeElement, `btn-color-primary`);
      this.renderer.removeClass(this.el.nativeElement, `btn-color-error`);

      // Add new color class
      if (color) {
        this.renderer.addClass(this.el.nativeElement, `btn-color-${color}`);
      }
    });
  }
}
