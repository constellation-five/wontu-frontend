import { Directive, ElementRef, Renderer2, inject, input, effect } from '@angular/core';

export type IconButtonVariant = 'text' | 'filled' | 'elevated' | 'tonal' | 'outlined';

@Directive({
  selector: '[appIconButtonVariant]',
  standalone: true,
})
export class IconButtonVariantDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  appIconButtonVariant = input<IconButtonVariant>('text');

  constructor() {
    effect(() => {
      const variant = this.appIconButtonVariant();

      // Remove all possible variant classes
      const variants: IconButtonVariant[] = ['text', 'filled', 'elevated', 'tonal', 'outlined'];
      variants.forEach((v) => {
        this.renderer.removeClass(this.el.nativeElement, `btn-variant-${v}`);
      });

      // Add the new variant class
      if (variant) {
        this.renderer.addClass(this.el.nativeElement, `btn-variant-${variant}`);
      }
    });
  }
}
