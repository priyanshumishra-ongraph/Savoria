import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RecipeCardComponent } from './recipe-card.component';
import { RecipeService } from '../../core/services/recipe.service';
import { Observable } from 'rxjs';
import { RecipeResponse } from '../../core/models/types';

@Component({
  selector: 'app-trending-section',
  standalone: true,
  imports: [RecipeCardComponent, NgFor, NgIf, AsyncPipe],
  template: `
    <section class="trending" *ngIf="(trending$ | async)?.recipes?.length">
      <div class="trending-header">
        <h3 class="trending-title">🔥 Trending this week </h3>
      </div>
      <div class="trending-scroll">
        <app-recipe-card *ngFor="let r of (trending$ | async)?.recipes"
          [recipe]="r" />
      </div>
    </section>
  `,
  styles: [`
    .trending { margin-bottom: 40px; padding: 12px 0; background: transparent; }
    .trending-header { margin-bottom: 40px; display: flex; align-items: baseline; gap: 12px; }
    .trending-title { font-size: 22px; color: #3C2218; margin: 0; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }
    .trending-sub { margin: 0; color: #718096; font-size: 14px; font-weight: normal; }
    .trending-scroll { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 12px; }
    .trending-scroll::-webkit-scrollbar { height: 8px; }
    .trending-scroll::-webkit-scrollbar-track { background: #f4f4f5; border-radius: 4px; }
    .trending-scroll::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 4px; }
    .trending-scroll > app-recipe-card { min-width: 280px; max-width: 320px; }
  `]
})
export class TrendingSectionComponent implements OnInit {
  private recipeService = inject(RecipeService);
  trending$!: Observable<RecipeResponse>;

  ngOnInit() {
    this.trending$ = this.recipeService.getTrending();
  }
}