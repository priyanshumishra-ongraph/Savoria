import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-sort-bar',
  standalone: true,
  imports: [MatIconModule, NgFor],
  template: `
    <div class="sort-bar">
      <button *ngFor="let opt of options" class="sort-pill"
              [class.active]="active === opt.value"
              (click)="select(opt.value)">
        <mat-icon>{{ opt.icon }}</mat-icon> {{ opt.label }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; max-width: 100%; }
    .sort-bar { display: flex; gap: 12px; overflow-x: auto; padding: 12px 0; margin-bottom: 20px; }
    .sort-bar::-webkit-scrollbar { display: none; }
    .sort-pill { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; border: 1px solid #d6d3d1; background: white; font-weight: 500; color: #78716c; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .sort-pill mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sort-pill:hover { background: #f4f4f5; }
    .sort-pill.active { background: #ea580c; color: white; border-color: #ea580c; }
  `]
})
export class SortBarComponent {
  @Input()  active: string = 'newest';
  @Output() sortChange = new EventEmitter<string>();

  options = [
    { value: 'newest',       label: 'Newest',        icon: 'schedule' },
    { value: 'rating',       label: 'Top Rated',     icon: 'star' },
    { value: 'mostReviewed', label: 'Most Reviewed', icon: 'rate_review' },
    { value: 'cookTime',     label: 'Quick Cooks',   icon: 'timer' },
  ];

  select(v: string) { this.sortChange.emit(v); }
}
