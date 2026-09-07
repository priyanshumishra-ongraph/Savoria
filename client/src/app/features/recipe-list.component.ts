import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
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
    MatInputModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatButtonModule
  ],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div class="header-content">
          <div class="title-area">
            <h2>Explore Recipes</h2>
            <p>Find your next culinary masterpiece.</p>
          </div>
          
          <div class="filters-container">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Search recipes...</mat-label>
              <input matInput [formControl]="searchControl" placeholder="E.g., Pasta, Vegan...">
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Category</mat-label>
              <mat-select [formControl]="categoryControl">
                <mat-option value="">All Categories</mat-option>
                <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <!-- Error State -->
        <div *ngIf="error" class="error-banner">
          {{ error }}
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading recipes...</p>
        </div>

        <!-- Recipe Grid -->
        <ng-container *ngIf="!isLoading && !error">
          <div>
            
            <div *ngIf="recipes.length > 0" class="recipe-grid">
              <app-recipe-card *ngFor="let recipe of recipes" [recipe]="recipe" [showAuthor]="true"></app-recipe-card>
            </div>

            <!-- Empty State -->
            <div *ngIf="recipes.length === 0" class="empty-state">
              <div class="empty-icon">🍳</div>
              <h3>No recipes found</h3>
              <p>Try adjusting your search or category filters.</p>
            </div>
            
            <!-- Pagination Controls -->
            <div class="pagination-controls" *ngIf="totalPages > 1">
              <button mat-flat-button color="primary" 
                      [disabled]="currentPage$.value === 1" 
                      (click)="goToPage(currentPage$.value - 1)">
                Previous
              </button>
              
              <span class="page-indicator">Page {{ currentPage$.value }} of {{ totalPages }}</span>
              
              <button mat-flat-button color="primary" 
                      [disabled]="currentPage$.value === totalPages" 
                      (click)="goToPage(currentPage$.value + 1)">
                Next
              </button>
            </div>

          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper { background-color: #faf5eb; min-height: 100vh; padding-bottom: 60px; }
    .dashboard-header { background: white; padding: 30px 20px; border-bottom: 1px solid #edf2f7; position: relative; top: 0; z-index: 90; }
    .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
    .title-area h2 { margin: 0; font-size: 28px; font-weight: 800; color: #3C2218; }
    .title-area p { margin: 4px 0 0; color: #718096; }
    
    .filters-container { display: flex; gap: 16px; flex: 1; justify-content: flex-end; }
    .filter-field { width: 100%; max-width: 250px; }
    
    .dashboard-content { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    
    .loading-state, .empty-state { text-align: center; padding: 60px 20px; color: #718096; display: flex; flex-direction: column; align-items: center; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-state h3 { color: #3C2218; margin-bottom: 8px; }
    .error-banner { padding: 12px 16px; background: #fee2e2; color: #dc2626; border-radius: 8px; margin-bottom: 24px; }

    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-top: 40px;
    }
    .page-indicator {
      font-weight: 600;
      color: #4a5568;
    }

    /* Force form fields to not reserve empty space for errors/hints here */
    ::ng-deep .filters-container .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    @media (max-width: 768px) {
      .header-content { flex-direction: column; align-items: stretch; gap: 16px; }
      .filters-container { justify-content: stretch; flex-direction: column; gap: 16px; margin-bottom: 8px; }
      .filter-field { max-width: 100%; width: 100%; }
      .dashboard-header { padding: 20px 16px; }
      .dashboard-content { padding: 24px 16px; }
      .recipe-grid { grid-template-columns: 1fr; gap: 16px; }
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