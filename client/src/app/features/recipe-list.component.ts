import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RecipeService } from '../core/services/recipe.service';
import { Recipe } from '../core/models/types';
import { Observable, combineLatest, of, BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, switchMap, startWith, catchError, tap, takeUntil } from 'rxjs/operators';
import { RecipeCardComponent } from '../shared/components/recipe-card.component';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, RecipeCardComponent,
    MatInputModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule
  ],
  template: `
    <div class="dashboard-wrapper">
      <div class="explore-header">
        <div class="explore-header-content">
          <div class="title-area">
            <h2 class="playfair">Explore Recipes</h2>
            <p>Find your next culinary masterpiece from our community of home chefs.</p>
          </div>
          
          <div class="filters-container">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input type="text" [formControl]="searchControl" placeholder="Search pasta, vegan, chicken...">
            </div>
            
            <div class="category-select-wrapper">
              <select [formControl]="categoryControl" class="custom-select">
                <option value="">All Categories</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
              <mat-icon class="select-icon">expand_more</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <!-- Error State -->
        <div *ngIf="error" class="error-banner">
          <mat-icon>error_outline</mat-icon> {{ error }}
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Curating recipes...</p>
        </div>

        <!-- Recipe Grid -->
        <ng-container *ngIf="!isLoading && !error">
          <div>
            <div *ngIf="recipes.length > 0" class="recipe-grid">
              <app-recipe-card *ngFor="let recipe of recipes" [recipe]="recipe" [showAuthor]="true"></app-recipe-card>
            </div>

            <!-- Empty State -->
            <div *ngIf="recipes.length === 0" class="empty-state">
              <div class="empty-icon-wrapper">
                <mat-icon>restaurant_menu</mat-icon>
              </div>
              <h3 class="playfair">No recipes found</h3>
              <p>We couldn't find anything matching your filters. Try exploring a different category!</p>
              <button mat-button color="primary" (click)="searchControl.setValue(''); categoryControl.setValue('')">Clear Filters</button>
            </div>
            
            <!-- Pagination Controls -->
            <div class="pagination-controls" *ngIf="totalPages > 1">
              <button class="nav-btn" [disabled]="currentPage$.value === 1" (click)="goToPage(currentPage$.value - 1)">
                <mat-icon>chevron_left</mat-icon> Previous
              </button>
              
              <span class="page-indicator">Page {{ currentPage$.value }} of {{ totalPages }}</span>
              
              <button class="nav-btn" [disabled]="currentPage$.value === totalPages" (click)="goToPage(currentPage$.value + 1)">
                Next <mat-icon>chevron_right</mat-icon>
              </button>
            </div>

          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper { background-color: #faf5eb; min-height: 100vh; padding-bottom: 80px; }
    
    .explore-header { 
      background: white; 
      padding: 60px 20px 40px; 
      border-bottom: 1px solid rgba(0,0,0,0.05); 
      position: relative; 
      z-index: 10; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }
    
    .explore-header-content { 
      max-width: 1200px; 
      margin: 0 auto; 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-end; 
      flex-wrap: wrap; 
      gap: 30px; 
    }
    
    .title-area h2 { 
      margin: 0; 
      font-size: 42px; 
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700; 
      color: #3C2218; 
      line-height: 1.2;
    }
    
    .title-area p { 
      margin: 8px 0 0; 
      color: #78716c; 
      font-size: 17px;
    }
    
    .filters-container { 
      display: flex; 
      gap: 16px; 
      flex: 1; 
      justify-content: flex-end; 
      min-width: 300px;
    }
    
    .search-box {
      display: flex;
      align-items: center;
      background: #f4f4f5;
      border-radius: 12px;
      padding: 0 16px;
      flex: 1;
      max-width: 300px;
      border: 1px solid transparent;
      transition: border-color 0.2s, background 0.2s;
    }
    
    .search-box:focus-within {
      background: white;
      border-color: #ea580c;
      box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
    }
    
    .search-box mat-icon {
      color: #a8a29e;
      margin-right: 8px;
    }
    
    .search-box input {
      border: none;
      background: transparent;
      padding: 14px 0;
      font-size: 15px;
      width: 100%;
      outline: none;
      color: #1c1917;
    }

    .category-select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .custom-select {
      appearance: none;
      background: white;
      border: 1px solid #d6d3d1;
      padding: 14px 40px 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 500;
      color: #3C2218;
      cursor: pointer;
      outline: none;
      min-width: 180px;
      transition: border-color 0.2s;
    }
    
    .custom-select:focus {
      border-color: #ea580c;
    }
    
    .select-icon {
      position: absolute;
      right: 12px;
      pointer-events: none;
      color: #78716c;
    }
    
    .dashboard-content { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    
    .recipe-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
      gap: 30px; 
    }
    
    .loading-state, .empty-state { 
      text-align: center; 
      padding: 80px 20px; 
      color: #78716c; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
    }
    
    .empty-icon-wrapper { 
      width: 80px; height: 80px; 
      background: #ffedd5; 
      color: #ea580c; 
      border-radius: 50%; 
      display: flex; align-items: center; justify-content: center; 
      margin-bottom: 24px;
    }
    
    .empty-icon-wrapper mat-icon { font-size: 40px; width: 40px; height: 40px; }
    
    .empty-state h3 { 
      font-size: 28px; 
      color: #3C2218; 
      margin: 0 0 12px; 
    }
    
    .error-banner { 
      padding: 16px 20px; 
      background: #fef2f2; 
      color: #b91c1c; 
      border-radius: 12px; 
      margin-bottom: 24px; 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      font-weight: 500; 
    }

    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      margin-top: 60px;
    }
    
    .nav-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: white;
      border: 1px solid #d6d3d1;
      padding: 8px 16px;
      border-radius: 30px;
      font-weight: 600;
      color: #3C2218;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .nav-btn:not([disabled]):hover {
      border-color: #ea580c;
      color: #ea580c;
    }
    
    .nav-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f5f5f5;
    }

    .page-indicator {
      font-weight: 600;
      color: #78716c;
      font-size: 15px;
    }

    @media (max-width: 768px) {
      .explore-header-content { flex-direction: column; align-items: stretch; gap: 20px; }
      .filters-container { flex-direction: column; }
      .search-box { max-width: 100%; }
      .explore-header { padding: 40px 20px 30px; }
      .recipe-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    }
  `]
})
export class RecipeListComponent implements OnInit, OnDestroy {
  private recipeService = inject(RecipeService);

  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  
  categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Beverage', 'Snack'];
  
  recipes: Recipe[] = [];
  isLoading = true;
  error: string | null = null;
  
  currentPage$ = new BehaviorSubject<number>(1);
  totalPages = 1;

  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Read initial category from query parameters
      const initialCategory = this.route.snapshot.queryParamMap.get('category') || '';
      if (initialCategory) {
        this.categoryControl.setValue(initialCategory);
      }

      const search$ = this.searchControl.valueChanges.pipe(
        startWith(this.searchControl.value || ''), 
        debounceTime(400),
        tap(() => this.currentPage$.next(1))
      );
      const category$ = this.categoryControl.valueChanges.pipe(
        startWith(this.categoryControl.value || ''),
        tap(() => this.currentPage$.next(1))
      );

      combineLatest([search$, category$, this.currentPage$]).pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.isLoading = true;
          this.error = null;
          this.cdr.detectChanges();
        }),
        switchMap(([search, category, page]) => 
          this.recipeService.getRecipes(search || '', category || '', page, 12).pipe(
            catchError(err => {
              this.error = 'Failed to load recipes. Please try again.';
              return of({ recipes: [], total: 0, pages: 1 });
            })
          )
        )
      ).subscribe(res => {
        this.recipes = res.recipes || [];
        this.totalPages = res.pages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage$.next(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
