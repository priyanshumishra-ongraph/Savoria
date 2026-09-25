import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecipeService } from "../core/services/recipe.service";
import { Recipe } from "../core/models/types";
import { RecipeCardComponent } from '../shared/components/recipe-card.component';

@Component({
  selector: 'app-category-recipes',
  standalone: true,
  imports: [CommonModule, RouterModule, RecipeCardComponent],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div class="header-content">
          <div class="title-area">
            <a routerLink="/recipes" class="back-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Categories
            </a>
            <h2>{{ categoryName }} Recipes</h2>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading recipes...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !isLoading" class="error-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {{ error }}
        </div>

        <!-- Content -->
        <ng-container *ngIf="!isLoading && !error">
          <ng-container *ngIf="recipes.length > 0; else noRecipes">
            <div class="recipe-grid">
              <app-recipe-card *ngFor="let recipe of recipes" [recipe]="recipe" [showAuthor]="true"></app-recipe-card>
            </div>
          </ng-container>

          <ng-template #noRecipes>
            <div class="empty-state">
              <div class="empty-icon">🍽️</div>
              <h3>No {{ categoryName }} recipes yet</h3>
              <p>Be the first to share a delicious {{ categoryName.toLowerCase() }} recipe!</p>
              <a routerLink="/recipes/new" class="create-btn empty-create-btn">Create Recipe</a>
            </div>
          </ng-template>
        </ng-container>
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
    
    .back-link:hover { color: #f97316; }

    .title-area h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      color: #1a202c;
      letter-spacing: -0.5px;
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
    
    .empty-create-btn { display: inline-flex; margin-top: 10px; }

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

    /* Loading */
    .loading-state {
      text-align: center;
      padding: 80px 20px;
      color: #718096;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #f97316;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 10px;
      font-weight: 500;
    }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 100px 20px;
      background: white;
      border-radius: 16px;
      border: 1px dashed #cbd5e0;
      max-width: 600px;
      margin: 0 auto;
    }
    .empty-icon { font-size: 64px; margin-bottom: 20px; }
    .empty-state h3 { margin: 0 0 10px; font-size: 24px; color: #2d3748; }
    .empty-state p { color: #718096; margin: 0 0 24px; font-size: 16px; }
  `]
})
export class CategoryRecipesComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private route = inject(ActivatedRoute);

  categoryName: string = '';
  recipes: Recipe[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.categoryName = params.get('name') || 'Other';
      this.loadRecipes();
    });
  }

  loadRecipes() {
    this.isLoading = true;
    this.error = null;
    this.recipeService.getRecipes().subscribe({
      next: (response) => {
        this.recipes = response.recipes.filter(
          (r: Recipe) => (r.category || 'Other').toLowerCase() === this.categoryName.toLowerCase()
        );
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load recipes. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
