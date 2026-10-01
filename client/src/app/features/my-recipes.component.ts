import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from "@angular/core";
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RecipeService } from "../core/services/recipe.service";
import { Recipe } from "../core/models/types";
import { of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { RecipeCardComponent } from '../shared/components/recipe-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-my-recipes',
  standalone: true,
  imports: [CommonModule, RouterModule, RecipeCardComponent, MatCardModule, MatIconModule],
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

      <div class="dashboard-content" *ngIf="stats" style="padding-bottom: 0;">
        <div class="section-header">
          <div class="section-icon pulse">
            <mat-icon style="color: #f97316;">update</mat-icon>
          </div>
          <h3>My Recipes Added Today</h3>
        </div>
        
        <div class="stats-grid">
          <mat-card class="stat-card" style="animation-delay: 0s;" *ngIf="isAdmin">
            <div class="stat-icon-bg">
              <mat-icon style="width: 40px; height: 40px; font-size: 40px;">menu_book</mat-icon>
            </div>
            <mat-card-content class="stat-content" style="padding: 0;">
              <div class="stat-value">{{ stats.totalRecipes || 0 }}</div>
              <div class="stat-label">Total Recipes</div>
            </mat-card-content>
            <div class="trend-indicator up">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">public</mat-icon>
              All Time
            </div>
          </mat-card>

          <mat-card class="stat-card" *ngFor="let cat of categoryKeys; let i = index" [style.animation-delay]="(i + 1) * 0.1 + 's'">
            <div class="stat-icon-bg">
              <mat-icon style="width: 40px; height: 40px; font-size: 40px;">{{ getCategoryIconName(cat) }}</mat-icon>
            </div>
            <mat-card-content class="stat-content" style="padding: 0;">
              <div class="stat-value">{{ stats.todayByCategory[cat] || 0 }}</div>
              <div class="stat-label">{{ cat }}</div>
            </mat-card-content>
            <div class="trend-indicator up">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">trending_up</mat-icon>
              Added Today
            </div>
          </mat-card>
        </div>
      </div>

      <div class="dashboard-content" *ngIf="isLoading">
        <div class="loading-state">
          <div class="spinner-ring"></div>
          <p>Loading your recipes...</p>
        </div>
      </div>

      <div class="dashboard-content" *ngIf="error && !isLoading">
        <div class="error-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {{ error }}
        </div>
      </div>

      <div class="dashboard-content" *ngIf="!isLoading && !error">
        <ng-container *ngIf="recipes.length > 0; else noRecipes">
          <div class="recipe-grid">
            <app-recipe-card *ngFor="let recipe of recipes" [recipe]="recipe"></app-recipe-card>
          </div>

          <!-- Pagination Controls -->
          <div class="pagination-container" *ngIf="totalPages > 1">
            <button class="page-btn" [disabled]="currentPage === 1" (click)="prevPage()">
              <mat-icon>chevron_left</mat-icon> Previous
            </button>
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button class="page-btn" [disabled]="currentPage === totalPages" (click)="nextPage()">
              Next <mat-icon>chevron_right</mat-icon>
            </button>
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
    .dashboard-wrapper { background-color: #faf5eb; min-height: calc(100vh - 70px); font-family: 'Inter', 'Segoe UI', sans-serif; padding-bottom: 60px; }
    .dashboard-header { background: white; padding: 24px 20px; border-bottom: 1px solid #edf2f7; position: relative; top: 0; z-index: 90; }
    .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
    .back-link { display: flex; align-items: center; gap: 6px; color: #718096; text-decoration: none; font-size: 14px; font-weight: 600; margin-bottom: 8px; transition: color 0.2s; }
    .back-link:hover { color: #f97316; }
    .title-area h2 { margin: 0; font-size: 28px; font-weight: 800; color: #3C2218; letter-spacing: -0.5px; }
    .dashboard-content { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }

    /* ✅ Loading */
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; color: #718096; }
    .spinner-ring { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ✅ Error */
    .error-banner { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: #fee2e2; color: #dc2626; border-radius: 10px; font-weight: 500; }

    /* ✅ Dashboard Stats */
    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .section-icon { width: 48px; height: 48px; border-radius: 12px; background: #fff7ed; display: flex; align-items: center; justify-content: center; }
    .section-header h3 { font-size: 24px; font-weight: 800; color: #3C2218; margin: 0; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; }
    .stat-card { background: linear-gradient(145deg, #ffffff, #fdfbf7); border-radius: 20px; padding: 32px 24px; min-height: 180px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid rgba(226,232,240,0.8); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.3s ease; animation: slideUp 0.5s ease both; }
    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(249,115,22,0.1); border-color: #f97316; }
    .stat-icon-bg { position: absolute; top: -15px; right: -15px; width: 100px; height: 100px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ea580c; opacity: 0.6; transition: transform 0.4s ease; }
    .stat-card:hover .stat-icon-bg { transform: scale(1.15) rotate(-10deg); }
    .stat-content { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 8px; }
    .stat-value { font-size: 48px; font-weight: 800; color: #f97316; line-height: 1; letter-spacing: -1px; margin: 0; font-family: 'Inter', sans-serif; }
    .stat-label { font-size: 15px; font-weight: 700; color: #3C2218; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
    .trend-indicator { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0; }
    .trend-indicator.up { color: #10b981; }

    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    /* ✅ Pagination */
    .pagination-container { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 40px; }
    .page-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: #f97316; border: none; border-radius: 10px; font-weight: 600; color: white; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(249,115,22,0.25); }
    .page-btn:hover:not([disabled]) { background: #ea580c; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(249,115,22,0.35); }
    .page-btn[disabled] { background: #e2e8f0; color: #a0aec0; cursor: not-allowed; box-shadow: none; transform: none; }
    .page-info { font-weight: 600; color: #718096; font-size: 15px; }

    .create-btn { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 15px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 12px rgba(249,115,22,0.25); }
    .create-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(249,115,22,0.35); }
    .empty-state { text-align: center; padding: 100px 20px; background: white; border-radius: 16px; border: 1px dashed #cbd5e0; max-width: 600px; margin: 0 auto; }
    .empty-icon { font-size: 64px; margin-bottom: 40px; }
    .empty-state h3 { margin: 0 0 10px; font-size: 24px; color: #3C2218; }
    .empty-state p { color: #718096; margin: 0 0 24px; font-size: 16px; }
    .empty-create-btn { display: inline-flex; margin-top: 10px; }
  `]
})
export class MyRecipesComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private authService = inject(AuthService);

  recipes: Recipe[] = [];
  isLoading = false;
  error: string | null = null;
  isAdmin = false;
  
  currentPage = 1;
  totalPages = 1;

  stats: any = null;
  categoryKeys: string[] = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Beverage', 'Snack'];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.isAdmin = user.role === 'admin';
        }
      });
      this.loadRecipes();
    }
  }

  loadRecipes() {
    this.isLoading = true;
    this.recipeService.getMyRecipes(this.currentPage, 6).subscribe({
      next: (response) => {
        if (response.recipes.length > 0 || !this.error) {
          this.recipes = response.recipes;
          this.totalPages = response.pages || 1;
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayByCategory: Record<string, number> = {};
          
          response.recipes.forEach(r => {
             const created = r.createdAt ? new Date(r.createdAt) : new Date();
             if (created >= today) {
                todayByCategory[r.category] = (todayByCategory[r.category] || 0) + 1;
             }
          });
          
          this.stats = {
            totalRecipes: response.total || response.recipes.length,
            todayByCategory
          };
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load your recipes. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRecipes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRecipes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getCategoryIconName(cat: string): string {
    const icons: Record<string, string> = {
      'Breakfast': 'bakery_dining',
      'Lunch': 'lunch_dining',
      'Dinner': 'dinner_dining',
      'Dessert': 'cake',
      'Beverage': 'local_cafe',
      'Snack': 'tapas'
    };
    return icons[cat] || 'restaurant';
  }
}
