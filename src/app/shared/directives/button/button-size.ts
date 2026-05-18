import { Directive, ElementRef, Renderer2, OnInit, inject, input } from '@angular/core';

export type ButtonSize = 'xs' | 'sm' | 'md';

@Directive({
  selector: '[appButtonSize]',
  standalone: true,
})
export class ButtonSizeDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  appButtonSize = input<ButtonSize>('sm');

  ngOnInit() {
    if (this.appButtonSize()) {
      this.renderer.addClass(this.el.nativeElement, `btn-size-${this.appButtonSize()}`);
    }
  }
}
