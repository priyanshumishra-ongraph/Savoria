import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RecipeCardComponent } from '../shared/components/recipe-card.component';
import { SearchService } from '../core/services/search.service';
import { AuthService } from '../core/services/auth.service';
import { RecommendedSectionComponent } from '../shared/components/recommended-section.component';
import { SortBarComponent } from '../shared/components/sort-bar.component';
import { FilterChipsComponent } from '../shared/components/filter-chips.component';
import { VoiceSearchBtnComponent } from '../shared/components/voice-search-btn.component';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule, RecipeCardComponent,
    MatProgressSpinnerModule, MatButtonModule, MatIconModule,
    RecommendedSectionComponent, SortBarComponent, FilterChipsComponent, VoiceSearchBtnComponent
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
              <app-voice-search-btn (result)="onVoiceResult($event)" />
              <input type="text" [ngModel]="(search.searchTerm$ | async)" (ngModelChange)="onSearchInput($event)" placeholder="Search pasta, vegan, chicken...">
            </div>
            <button class="mobile-filter-toggle" (click)="showFilters = !showFilters">
              <mat-icon>tune</mat-icon>
              Filters
            </button>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="two-column-layout">
          <!-- Left Sidebar -->
          <aside class="sidebar" [class.mobile-hidden]="!showFilters">
            <app-filter-chips></app-filter-chips>
          </aside>

          <!-- Right Content -->
          <main class="main-content">
            <app-recommended-section *ngIf="(auth.currentUser$ | async)" />
            
            <app-sort-bar [active]="(search.sort$ | async)!" (sortChange)="onSort($event)" />

            <ng-container *ngIf="{ loading: search.loading$ | async, results: results$ | async } as state">
              <div *ngIf="state.loading" class="loading-state">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Curating recipes...</p>
              </div>

              <ng-container *ngIf="!state.loading && state.results">
                <div *ngIf="state.results.recipes.length > 0" class="recipe-grid">
                  <app-recipe-card *ngFor="let recipe of state.results.recipes" [recipe]="recipe" [showAuthor]="true"></app-recipe-card>
                </div>

                <div *ngIf="state.results.recipes.length === 0" class="empty-state">
                  <div class="empty-icon-wrapper">
                    <mat-icon>restaurant_menu</mat-icon>
                  </div>
                  <h3 class="playfair">No recipes found</h3>
                  <p>We couldn't find anything matching your filters. Try adjusting them!</p>
                  <button mat-button color="primary" (click)="search.setSearch('')">Clear Search</button>
                </div>
                
                <div class="pagination-controls" *ngIf="state.results.pages && state.results.pages > 1">
                  <button class="nav-btn" [disabled]="state.results.page === 1" (click)="goToPage((state.results.page || 1) - 1)">
                    <mat-icon>chevron_left</mat-icon> Previous
                  </button>
                  
                  <span class="page-indicator">Page {{ state.results.page }} of {{ state.results.pages }}</span>
                  
                  <button class="nav-btn" [disabled]="state.results.page === state.results.pages" (click)="goToPage((state.results.page || 1) + 1)">
                    Next <mat-icon>chevron_right</mat-icon>
                  </button>
                </div>
              </ng-container>
            </ng-container>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; max-width: 100%; overflow-x: hidden; }

    /* ── Wrapper ─────────────────────────────── */
    .dashboard-wrapper {
      background-color: #faf5eb;
      min-height: 100vh;
      padding-bottom: 60px;
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    /* ── Header bar ──────────────────────────── */
    .explore-header {
      background: white;
      padding: 50px 24px 36px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 2px 12px rgba(0,0,0,0.03);
      box-sizing: border-box;
      width: 100%;
    }
    .explore-header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 24px;
      box-sizing: border-box;
    }
    .title-area h2 {
      margin: 0;
      font-size: 38px;
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      color: #3C2218;
      line-height: 1.2;
    }
    .title-area p { margin: 8px 0 0; color: #78716c; font-size: 16px; }

    /* ── Search row ──────────────────────────── */
    .filters-container {
      display: flex;
      gap: 12px;
      align-items: center;
      flex: 1;
      min-width: 0;
      max-width: 460px;
      box-sizing: border-box;
    }
    .search-box {
      display: flex;
      align-items: center;
      background: #f4f4f5;
      border-radius: 12px;
      padding: 0 14px;
      flex: 1;
      min-width: 0;
      border: 1.5px solid transparent;
      transition: border-color 0.2s, background 0.2s;
      box-sizing: border-box;
    }
    .search-box:focus-within {
      background: white;
      border-color: #ea580c;
      box-shadow: 0 0 0 3px rgba(234,88,12,0.12);
    }
    .search-box app-voice-search-btn { margin-right: 4px; flex-shrink: 0; }
    .search-box input {
      border: none;
      background: transparent;
      padding: 13px 0;
      font-size: 15px;
      width: 100%;
      outline: none;
      color: #1c1917;
      min-width: 0;
    }
    .mobile-filter-toggle {
      display: none;
      align-items: center;
      gap: 6px;
      padding: 11px 18px;
      background: white;
      border: 1.5px solid #d6d3d1;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      color: #3C2218;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Body layout ─────────────────────────── */
    .dashboard-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 36px 24px;
      width: 100%;
      box-sizing: border-box;
    }
    .two-column-layout {
      display: flex;
      gap: 32px;
      align-items: flex-start;
      width: 100%;
      box-sizing: border-box;
    }
    .sidebar {
      flex: 0 0 272px;
      width: 272px;
      position: sticky;
      top: 20px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      border-radius: 16px;
      scrollbar-width: thin;
      scrollbar-color: rgba(0,0,0,0.1) transparent;
    }
    .sidebar::-webkit-scrollbar { width: 5px; }
    .sidebar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
    .main-content { flex: 1; min-width: 0; width: 100%; box-sizing: border-box; }

    /* ── Recipe grid ─────────────────────────── */
    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
      gap: 24px;
      width: 100%;
      box-sizing: border-box;
    }

    /* ── States ──────────────────────────────── */
    .loading-state, .empty-state {
      text-align: center; padding: 80px 20px; color: #78716c;
      display: flex; flex-direction: column; align-items: center;
    }
    .empty-icon-wrapper {
      width: 80px; height: 80px; background: #ffedd5; color: #ea580c;
      border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
    }
    .empty-icon-wrapper mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-state h3 { font-size: 26px; color: #3C2218; margin: 0 0 12px; }

    /* ── Pagination ──────────────────────────── */
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 48px;
      padding-top: 28px;
      border-top: 1px solid #e5e7eb;
      width: 100%;
      box-sizing: border-box;
    }
    .nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: white;
      border: 1.5px solid #d6d3d1;
      padding: 10px 22px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      color: #3C2218;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 110px;
      white-space: nowrap;
    }
    .nav-btn:not([disabled]):hover { border-color: #ea580c; color: #ea580c; background: #fff7f3; }
    .nav-btn[disabled] { opacity: 0.45; cursor: not-allowed; background: #f5f5f4; }
    .page-indicator { font-weight: 600; color: #78716c; font-size: 14px; text-align: center; white-space: nowrap; }

    /* ── Tablet landscape ≤ 1100px ───────────── */
    @media (max-width: 1100px) {
      .two-column-layout { flex-direction: column; gap: 0; }
      .sidebar {
        flex: none;
        width: 100%;
        position: static;
        max-height: none;
        border-radius: 12px;
        margin-bottom: 20px;
      }
      .mobile-hidden { display: none !important; }
      .mobile-filter-toggle { display: inline-flex; }
      .explore-header-content { flex-direction: column; align-items: stretch; gap: 16px; }
      .filters-container { max-width: 100%; width: 100%; }
      .search-box { max-width: none; }
      .explore-header { padding: 32px 20px 24px; }
      .title-area h2 { font-size: 30px; }
      .recipe-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .dashboard-content { padding: 28px 20px; }
    }

    /* ── Small tablet / phone landscape ≤ 768px  */
    @media (max-width: 768px) {
      .dashboard-content { padding: 24px 16px; }
      .title-area h2 { font-size: 26px; }
      .recipe-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
      .nav-btn { min-width: 90px; padding: 9px 16px; font-size: 13px; }
    }

    /* ── Phone portrait ≤ 480px ──────────────── */
    @media (max-width: 480px) {
      .explore-header { padding: 24px 16px 20px; }
      .dashboard-content { padding: 20px 12px; }
      .title-area h2 { font-size: 22px; }
      .recipe-grid { grid-template-columns: 1fr; gap: 18px; }
      .pagination-controls { gap: 10px; margin-top: 32px; }
      .nav-btn { min-width: 80px; padding: 8px 14px; font-size: 13px; }
    }
  `]
})
export class RecipeListComponent implements OnInit {
  public search = inject(SearchService);
  public auth = inject(AuthService);
  
  results$ = this.search.results$;
  showFilters = false;

  ngOnInit() {}

  onSearchInput(val: string) { this.search.setSearch(val); }
  onSort(s: string)         { this.search.setSort(s as any); }
  onVoiceResult(text: string) { this.search.setSearch(text); }

  goToPage(page: number) {
    this.search.nextPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}