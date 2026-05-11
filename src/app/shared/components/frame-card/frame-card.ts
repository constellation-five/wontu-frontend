import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'frame-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frame-card.html',
  styleUrls: ['./frame-card.scss'],
})
export class CustomCardComponent {
  @Input() title?: string; 
  @Input() showTitle: boolean = true; 
}
