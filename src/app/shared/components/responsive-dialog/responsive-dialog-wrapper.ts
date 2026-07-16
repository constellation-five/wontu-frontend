import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Injector,
  Type,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { BottomBar } from '../bottom-bar/bottom-bar';
import { RESPONSIVE_DIALOG_CONTEXT } from './responsive-dialog-context';

export const MOBILE_BREAKPOINT = '(max-width: 768px)';

export interface ResponsiveDialogWrapperData<D = unknown> {
  component: Type<unknown>;
  title: string;
  componentData?: D;
}

@Component({
  selector: 'app-responsive-dialog-wrapper',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule, BottomBar],
  templateUrl: './responsive-dialog-wrapper.html',
  styleUrls: ['./responsive-dialog-wrapper.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveDialogWrapper implements AfterViewInit {
  private readonly wrapperData = inject<ResponsiveDialogWrapperData>(MAT_DIALOG_DATA);
  private readonly injector = inject(Injector);
  private readonly dialogRef = inject(MatDialogRef<ResponsiveDialogWrapper>);
  private readonly breakpointObserver = inject(BreakpointObserver);

  @ViewChild('outlet', { read: ViewContainerRef, static: true })
  private outlet!: ViewContainerRef;

  readonly title = this.wrapperData.title;
  readonly isMobile = toSignal(
    this.breakpointObserver.observe(MOBILE_BREAKPOINT).pipe(map((state) => state.matches)),
    { initialValue: this.breakpointObserver.isMatched(MOBILE_BREAKPOINT) },
  );

  ngAfterViewInit(): void {
    const childInjector = Injector.create({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: this.wrapperData.componentData },
        { provide: RESPONSIVE_DIALOG_CONTEXT, useValue: { isMobile: this.isMobile } },
      ],
      parent: this.injector,
    });

    this.outlet.createComponent(this.wrapperData.component, { injector: childInjector });
  }

  close(): void {
    this.dialogRef.close();
  }
}
