import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner" [style.width.px]="size" [style.height.px]="size" [style.border-top-color]="color" [style.border-width.px]="borderWidth"></div>
  `,
  styles: [`
    .spinner {
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: number = 18;
  @Input() color: string = 'white';
  @Input() borderWidth: number = 2;
}
