import { Component, inject } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, CommonModule, AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-filter-chips',
  standalone: true,
  imports: [MatChipsModule, MatSliderModule, MatIconModule, FormsModule, NgFor, NgIf, CommonModule, AsyncPipe, MatButtonModule],
  template: `
    <div class="sidebar-panel" *ngIf="{
      categories: search.categories$ | async,
      difficulties: search.difficulties$ | async,
      tags: search.tags$ | async,
      ingredients: search.ingredients$ | async,
      strict: search.strictIngredients$ | async,
      maxCookTime: search.maxCookTime$ | async,
      minRating: search.minRating$ | async
    } as state">
      
      <div class="sidebar-header">
        <h3><mat-icon>tune</mat-icon> Filters</h3>
        <button class="clear-btn" (click)="clearAll()" *ngIf="hasActiveFilters(state)">Clear All</button>
      </div>

      <!-- Categories -->
      <div class="filter-section">
        <h4 class="section-title">Category</h4>
        <div class="checkbox-group">
          <label class="custom-checkbox" *ngFor="let cat of availableCategories">
            <input type="checkbox" [checked]="state.categories?.includes(cat)" (change)="toggleArrayItem('categories', cat, state.categories!)">
            <span class="checkmark"></span>
            {{ cat }}
          </label>
        </div>
      </div>

      <!-- Difficulties -->
      <div class="filter-section">
        <h4 class="section-title">Difficulty</h4>
        <div class="checkbox-group">
          <label class="custom-checkbox" *ngFor="let diff of availableDifficulties">
            <input type="checkbox" [checked]="state.difficulties?.includes(diff)" (change)="toggleArrayItem('difficulties', diff, state.difficulties!)">
            <span class="checkmark"></span>
            {{ diff }}
          </label>
        </div>
      </div>

      <!-- Dietary Tags -->
      <div class="filter-section">
        <h4 class="section-title">Dietary</h4>
        <div class="checkbox-group">
          <label class="custom-checkbox" *ngFor="let tag of availableTags">
            <input type="checkbox" [checked]="state.tags?.includes(tag)" (change)="toggleArrayItem('tags', tag, state.tags!)">
            <span class="checkmark"></span>
            {{ tag }}
          </label>
        </div>
      </div>

      <!-- Max Cook Time -->
      <div class="filter-section">
        <h4 class="section-title">
          Max Cook Time
          <span class="value-badge">{{ state.maxCookTime === 120 || state.maxCookTime === null ? 'Any' : '< ' + state.maxCookTime + 'm' }}</span>
        </h4>
        <mat-slider min="5" max="120" step="5" [discrete]="true" color="accent" class="custom-slider">
          <input matSliderThumb [value]="state.maxCookTime || 120" (valueChange)="search.setMaxCookTime($event === 120 ? null : $event)">
        </mat-slider>
      </div>

      <!-- Minimum Rating -->
      <div class="filter-section">
        <h4 class="section-title">Minimum Rating</h4>
        <div class="star-row">
          <button *ngFor="let s of [1,2,3,4,5]" class="star-btn"
                  [class.active]="(state.minRating || 0) >= s"
                  (click)="search.setMinRating((state.minRating || 0) === s ? 0 : s)">
            <mat-icon>{{ (state.minRating || 0) >= s ? 'star' : 'star_border' }}</mat-icon>
          </button>
        </div>
      </div>

      <!-- Ingredients -->
      <div class="filter-section ingredient-section">
        <h4 class="section-title">Ingredients</h4>
        
        <div class="strict-toggle">
          <label class="switch">
            <input type="checkbox" [checked]="state.strict" (change)="search.setStrictIngredients(!state.strict)">
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">Strict Match (Must have all)</span>
        </div>

        <div class="chip-input-row">
          <input class="ingredient-input" placeholder="Add ingredient..."
                 [(ngModel)]="ingredientInput"
                 (keydown.enter)="addIngredient(state.ingredients!)"
                 (keydown.comma)="addIngredient(state.ingredients!)" />
          <button class="add-btn" (click)="addIngredient(state.ingredients!)">+</button>
        </div>
        
        <mat-chip-set class="selected-chips" *ngIf="state.ingredients!.length > 0">
          <mat-chip *ngFor="let ing of state.ingredients!" [removable]="true"
                    (removed)="removeIngredient(ing, state.ingredients!)" class="custom-chip">
            {{ ing }}
            <mat-icon matChipRemove>cancel</mat-icon>
          </mat-chip>
        </mat-chip-set>
      </div>

    </div>
  `,
  styles: [`
    .sidebar-panel {
      background: white;
      border: 1px solid rgba(226, 232, 240, 0.8);
      overflow: hidden;
      padding-bottom: 24px;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      /* Dark Brown premium header matching the website's dark text color */
      background: #3C2218;
      color: #faf5eb;
    }

    .sidebar-header h3 { 
      margin: 0; 
      font-size: 18px; 
      font-weight: 700; 
      color: #faf5eb; 
      display: flex; 
      align-items: center; 
      gap: 8px; 
    }
    .sidebar-header h3 mat-icon { color: #ea580c; }
    
    .clear-btn { 
      background: transparent;
      color: #ea580c; 
      border: 1px solid #ea580c;
      border-radius: 6px;
      font-size: 12px; 
      font-weight: 700; 
      padding: 6px 12px; 
      cursor: pointer;
      transition: all 0.2s;
    }
    .clear-btn:hover {
      background: #ea580c;
      color: white;
    }

    .filter-section {
      padding: 24px 20px 0;
    }

    .section-title {
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 700;
      color: #3C2218;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Checkboxes */
    .checkbox-group { display: flex; flex-direction: column; gap: 12px; }
    .custom-checkbox {
      display: flex;
      align-items: center;
      position: relative;
      padding-left: 28px;
      cursor: pointer;
      font-size: 14px;
      color: #57534e;
      user-select: none;
    }
    .custom-checkbox input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
    .checkmark {
      position: absolute; top: 0; left: 0; height: 18px; width: 18px;
      background-color: #f4f4f5; border: 1px solid #d6d3d1; border-radius: 4px;
      transition: all 0.2s;
    }
    .custom-checkbox:hover input ~ .checkmark { background-color: #e4e4e7; }
    .custom-checkbox input:checked ~ .checkmark { background-color: #ea580c; border-color: #ea580c; }
    .checkmark:after { content: ""; position: absolute; display: none; }
    .custom-checkbox input:checked ~ .checkmark:after { display: block; }
    .custom-checkbox .checkmark:after {
      left: 5px; top: 2px; width: 4px; height: 9px;
      border: solid white; border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    /* Slider tweaks */
    ::ng-deep .custom-slider .mdc-slider__track--active_fill { border-color: #ea580c !important; }
    ::ng-deep .custom-slider .mdc-slider__thumb-knob { background-color: #ea580c !important; border-color: #ea580c !important; }
    .value-badge { background: #ffedd5; color: #ea580c; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700; }

    /* Stars */
    .star-row { display: flex; align-items: center; gap: 4px; }
    .star-btn { background: none; border: none; padding: 0; color: #d6d3d1; cursor: pointer; transition: all 0.2s; }
    .star-btn mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .star-btn:hover { transform: scale(1.1); }
    .star-btn.active { color: #f59e0b; }

    /* Ingredients */
    .strict-toggle { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .toggle-label { font-size: 13px; color: #78716c; font-weight: 500; }
    .switch { position: relative; display: inline-block; width: 36px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #d6d3d1; transition: .4s; border-radius: 34px; }
    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #ea580c; }
    input:checked + .slider:before { transform: translateX(16px); }

    .chip-input-row { display: flex; gap: 8px; margin-bottom: 12px; }
    .ingredient-input { flex: 1; padding: 8px 12px; border: 1px solid #d6d3d1; border-radius: 6px; outline: none; font-size: 13px; }
    .ingredient-input:focus { border-color: #ea580c; }
    .add-btn { background: #3C2218; color: white; border: none; border-radius: 6px; width: 32px; font-size: 16px; cursor: pointer; }
    
    .selected-chips { display: block; }
    ::ng-deep .custom-chip { background-color: #ea580c !important; color: white !important; font-size: 12px !important; min-height: 28px !important; }
    ::ng-deep .custom-chip .mat-mdc-chip-remove { color: rgba(255,255,255,0.8) !important; }
  `]
})
export class FilterChipsComponent {
  public search = inject(SearchService);

  availableCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Beverage', 'Snack'];
  availableDifficulties = ['Easy', 'Medium', 'Hard'];
  availableTags = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Quick'];

  ingredientInput = '';

  hasActiveFilters(state: any): boolean {
    return state.categories?.length > 0 || state.difficulties?.length > 0 || state.tags?.length > 0 || 
           state.ingredients?.length > 0 || state.maxCookTime < 120 || state.minRating > 0;
  }

  clearAll() {
    this.search.clearAll();
  }

  toggleArrayItem(type: 'categories'|'difficulties'|'tags', item: string, current: string[]) {
    const next = current.includes(item) ? current.filter(x => x !== item) : [...current, item];
    if (type === 'categories') this.search.setCategories(next);
    if (type === 'difficulties') this.search.setDifficulties(next);
    if (type === 'tags') this.search.setTags(next);
  }

  addIngredient(current: string[]) {
    const v = this.ingredientInput.trim().replace(/,$/, '');
    if (v && !current.includes(v)) {
      this.search.setIngredients([...current, v]);
    }
    this.ingredientInput = '';
  }

  removeIngredient(ing: string, current: string[]) {
    this.search.setIngredients(current.filter(i => i !== ing));
  }
}