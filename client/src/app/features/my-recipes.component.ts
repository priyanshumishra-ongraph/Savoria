import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, inject, OnInit, PLATFORM_ID } from "@angular/core";
import { RouterModule } from '@angular/router';
import { RecipeService } from "../core/services/recipe.service";
import { Recipe } from "../core/models/types";
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RecipeCardComponent } from '../shared/components/recipe-card.component';

@Component({
  selector: 'app-my-recipes',
  standalone: true,
  imports: [CommonModule, RouterModule, RecipeCardComponent],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div class="header-content">
          <div class="title-area">
            <a routerLink="/recipes" class="back-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Dashboard
            </a>
            <h2>My Recipes</h2>
          </div>
        </div>
      </div>

      <div class="dashboard-content" *ngIf="recipes$ | async as recipes">
        <ng-container *ngIf="recipes.length > 0; else noRecipes">
          <div class="recipe-grid">
            <app-recipe-card *ngFor="let recipe of recipes" [recipe]="recipe"></app-recipe-card>
          </div>
        </ng-container>
        
        <ng-template #noRecipes>
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>You haven't added any recipes yet!</h3>
            <p>Share your favorite dishes with the community.</p>
            <a routerLink="/recipes/new" class="create-btn empty-create-btn">Create Your First Recipe</a>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      background-color: #f8f9fa;
      min-height: calc(100vh - 70px);
      font-family: 'Inter', 'Segoe UI', sans-serif;
      padding-bottom: 60px;
    }

    .dashboard-header {
      background: white;
      padding: 24px 20px;
      border-bottom: 1px solid #edf2f7;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .back-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #718096;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      transition: color 0.2s;
    }
    
    .back-link:hover {
      color: #f97316;
    }

    .title-area h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      color: #1a202c;
      letter-spacing: -0.5px;
    }

    .dashboard-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .create-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
    }
    
    .create-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
    }

    .empty-state {
      text-align: center;
      padding: 100px 20px;
      background: white;
      border-radius: 16px;
      border: 1px dashed #cbd5e0;
      max-width: 600px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px;
      font-size: 24px;
      color: #2d3748;
    }

    .empty-state p {
      color: #718096;
      margin: 0 0 24px;
      font-size: 16px;
    }
    
    .empty-create-btn {
      display: inline-flex;
      margin-top: 10px;
    }
  `]
})
export class MyRecipesComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private platformId = inject(PLATFORM_ID);
  
  recipes$!: Observable<Recipe[]>;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.recipes$ = this.recipeService.getMyRecipes().pipe(
        map(response => response.recipes)
      );
    } else {
      this.recipes$ = of([]);
    }
  }

  getCategoryImage(category: string): string {
    const c = (category || 'other').toLowerCase();
    if (c === 'breakfast') return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80';
    if (c === 'lunch') return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80';
    if (c === 'dinner') return 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80';
    if (c === 'dessert') return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80';
    if (c === 'beverage') return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80';
    if (c === 'snack') return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80';
    return 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80';
  }
}
