import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RecipeCardComponent } from './recipe-card.component';
import { RecipeService } from '../../core/services/recipe.service';
import { Observable } from 'rxjs';
import { RecipeResponse } from '../../core/models/types';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recommended-section',
  standalone: true,
  imports: [RecipeCardComponent, NgFor, NgIf, AsyncPipe],
  template: `
    <section class="recommended" *ngIf="(recommended$ | async)?.recipes?.length">
      <div class="recommended-header">
        <h3 class="recommended-title">✨ Recommended for You </h3>
      </div>
      <div class="recommended-scroll">
        <app-recipe-card *ngFor="let r of (recommended$ | async)?.recipes"
                         [recipe]="r" />
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; max-width: 100%; overflow: hidden; }
    .recommended { margin-bottom: 40px; padding: 12px 0; background: transparent; }
    .recommended-header { margin-bottom: 40px; display: flex; align-items: baseline; gap: 12px; }
    .recommended-title { font-size: 22px; color: #3C2218; margin: 0; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }
    .recommended-scroll { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 12px; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; scroll-behavior: smooth; }
    .recommended-scroll::-webkit-scrollbar { height: 8px; }
    .recommended-scroll::-webkit-scrollbar-track { background: #f4f4f5; border-radius: 4px; }
    .recommended-scroll::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 4px; }
    .recommended-scroll > app-recipe-card { width: 280px; flex: 0 0 280px; scroll-snap-align: start; }
  `]
})
export class RecommendedSectionComponent implements OnInit {
  private recipeService = inject(RecipeService);
  public authService = inject(AuthService);
  
  recommended$!: Observable<RecipeResponse>;

  ngOnInit() {
    this.recommended$ = this.recipeService.getRecommended();
  }
}