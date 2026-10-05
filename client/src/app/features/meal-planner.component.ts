import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { startOfWeek, addDays, format, subWeeks, addWeeks } from 'date-fns';
import { Subscription } from 'rxjs';
import { MealPlannerService } from '../core/services/meal-planner.service';
import { RecipeService } from '../core/services/recipe.service';
import { MealPlanEntry, MealType, ShoppingListItem } from '../core/models/meal-plan';
import { Recipe } from '../core/models/types';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface WeekDayInfo {
  date: Date;
  iso: string;
}

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    MatTabsModule,
    MatCheckboxModule
  ],
  template: `
<div class="meal-planner-container">
  <!-- Header & Navigation -->
  <header class="planner-header no-print">
    <div class="week-controls">
      <button mat-icon-button (click)="prevWeek()" aria-label="Previous week">
        <mat-icon>chevron_left</mat-icon>
      </button>
      <h2>Week of {{ weekDays[0]?.date | date:'MMM d, yyyy' }}</h2>
      <button mat-icon-button (click)="nextWeek()" aria-label="Next week">
        <mat-icon>chevron_right</mat-icon>
      </button>
    </div>
    <button mat-flat-button color="primary" (click)="printShoppingList()" class="print-btn" aria-label="Export or Print List">
      <mat-icon>print</mat-icon> Export List
    </button>
  </header>

  <mat-tab-group animationDuration="0ms" class="no-print">
    <!-- TAB 1: WEEKLY GRID -->
    <mat-tab label="Weekly Grid">
      <div class="grid-container">
        <!-- Meal Headers (Left Column) -->
        <div class="grid-row header-row">
          <div class="grid-cell empty-cell"></div>
          <div class="grid-cell day-header" *ngFor="let day of weekDays">
            <span class="day-name">{{ day.date | date:'EEE' }}</span>
            <span class="day-date">{{ day.date | date:'MMM d' }}</span>
          </div>
        </div>

        <!-- Meal Rows -->
        <div class="grid-row" *ngFor="let type of mealTypes">
          <div class="grid-cell meal-header">{{ type }}</div>
          
          <div class="grid-cell day-cell" *ngFor="let day of weekDays">
            <div class="meal-content" *ngIf="mealGrid.get(day.iso + '-' + type) as meal; else emptySlot">
              <mat-card class="meal-card">
                <mat-card-content>
                  <p class="recipe-name">{{ meal.recipeName }}</p>
                  <button mat-icon-button color="warn" class="remove-btn" (click)="removeMeal(meal.id)" aria-label="Remove meal">
                    <mat-icon>close</mat-icon>
                  </button>
                </mat-card-content>
              </mat-card>
            </div>
            
            <ng-template #emptySlot>
              <mat-form-field appearance="outline" class="recipe-select" subscriptSizing="dynamic">
                <mat-label>Add Recipe</mat-label>
                <mat-select (selectionChange)="onRecipeSelect(day.iso, type, $event.value)">
                  <mat-option *ngFor="let r of availableRecipes" [value]="r._id">
                    {{ r.title }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </ng-template>
          </div>
        </div>
      </div>
    </mat-tab>

    <!-- TAB 2: SHOPPING LIST -->
    <mat-tab label="Shopping List (Preview)">
      <div class="shopping-list-preview">
        <h3>Aggregated Ingredients for {{ weekDays[0]?.date | date:'MMM d' }} - {{ weekDays[6]?.date | date:'MMM d' }}</h3>
        
        <mat-card *ngIf="shoppingList.length === 0" class="empty-state">
          <mat-card-content>No ingredients found. Add some recipes to your plan!</mat-card-content>
        </mat-card>

        <mat-card *ngIf="shoppingList.length > 0" class="list-card">
          <mat-card-content>
            <div class="list-item" *ngFor="let item of shoppingList">
              <mat-checkbox 
                [checked]="item.isChecked" 
                (change)="toggleShoppingItem(item)">
                <span [class.checked]="item.isChecked">
                  {{ item.name }} - {{ item.totalQuantity | number:'1.0-2' }}
                </span>
              </mat-checkbox>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </mat-tab>
  </mat-tab-group>

  <!-- PRINT-ONLY VIEW -->
  <div class="print-only">
    <table class="print-table">
      <thead>
        <tr>
          <td><div class="print-spacer"></div></td>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <td><div class="print-spacer"></div></td>
        </tr>
      </tfoot>
      <tbody>
        <tr>
          <td>
            <h1 class="print-brand">Savoria</h1>
            <p class="print-subtitle">Shopping ingredients for this week ({{ weekDays[0]?.date | date:'MMM d' }} - {{ weekDays[6]?.date | date:'MMM d, yyyy' }})</p>
            <ul>
              <li *ngFor="let item of shoppingList">
                <span class="print-checkbox"></span>
                <span class="print-item-text">{{ item.name }} - {{ item.totalQuantity | number:'1.0-2' }}</span>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styles: [`
.meal-planner-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 600px) {
    padding: 12px;
  }
}

.planner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .week-controls {
    display: flex;
    align-items: center;
    gap: 16px;

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      white-space: nowrap;
    }
  }
}

.print-btn {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
  color: white !important;
  border-radius: 12px !important;
  padding: 0 24px !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;

  @media (max-width: 600px) {
    width: fit-content;
    padding: 12px 24px !important;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
  }
}

/* Style the Material Tabs to use Savoria Orange instead of default Blue */
mat-tab-group {
  ::ng-deep {
    .mdc-tab-indicator__content--underline {
      border-color: #ea580c !important; /* Orange underline */
    }
    .mdc-tab--active .mdc-tab__text-label {
      color: #ea580c !important; /* Orange active text */
      font-weight: 600;
    }
    .mdc-tab__text-label {
      color: #7c2d12; /* Dark warm brown for inactive tabs */
      font-size: 1rem;
    }
    .mat-mdc-tab:not(.mdc-tab--active):hover .mdc-tab__text-label {
      color: #ea580c !important;
    }
  }
}

.grid-container {
  display: flex;
  flex-direction: column;
  margin-top: 24px;
  border: 2px solid #fed7aa;
  border-radius: 8px;
  overflow-x: auto;
}

.grid-row {
  display: flex;
  min-width: 1000px; /* Force scroll on small screens */
  
  &:not(:last-child) {
    border-bottom: 1px solid #fed7aa;
  }
}

.grid-cell {
  flex: 1;
  padding: 12px;
  border-right: 1px solid #fed7aa;
  min-width: 140px;
  
  &:last-child {
    border-right: none;
  }
}

.header-row {
  background: #faf8f5;
  font-weight: bold;
  border-bottom: 2px solid #fed7aa;
}

.empty-cell, .meal-header {
  flex: 0 0 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fffdfa;
  font-weight: 600;
  color: #9a3412;
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;

  .day-name {
    text-transform: uppercase;
    font-size: 0.85rem;
    color: #c2410c;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .day-date {
    font-size: 1.2rem;
    color: #431407;
  }
}

.day-cell {
  background: #fff;
  vertical-align: top;
}

.meal-card {
  position: relative;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.1) !important;
  border: 1px solid #fed7aa;
  border-left: 4px solid #f97316;
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2) !important;
  }
  
  .mat-mdc-card-content {
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .recipe-name {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.3;
    color: #7c2d12;
    padding-right: 24px; /* Space for close btn */
  }

  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    padding: 0;
    .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }
  }
}

.recipe-select {
  width: 100%;
  
  ::ng-deep .mdc-text-field {
    background-color: transparent !important;
  }
  
  ::ng-deep .mat-mdc-form-field-subscript-wrapper {
    display: none !important;
  }
}

.shopping-list-preview {
  margin-top: 24px;
  max-width: 600px;

  h3 {
    color: #9a3412;
    margin-bottom: 16px;
    font-weight: 600;
  }

  .list-card {
    padding: 16px;
    background: #fffdfa;
    border: 1px solid #fed7aa;
    border-top: 4px solid #f97316;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(249, 115, 22, 0.05);
  }

  .list-item {
    margin-bottom: 0;
    padding: 12px 0;
    border-bottom: 1px dashed #fed7aa;
    
    &:last-child {
      border-bottom: none;
    }
    
    .checked {
      text-decoration: line-through;
      color: #fdba74;
      font-style: italic;
    }
  }
}

/* Print Styles */
.print-only {
  display: none;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    margin: 0; /* Removes browser default headers (date, title, URL) */
  }

  .no-print {
    display: none !important;
  }
  
  .print-only {
    display: block;
    
    .print-table {
      width: 100%;
      padding: 0 1.5cm; /* left and right margin */
    }

    .print-spacer {
      height: 1.5cm; /* Forces a blank gap at the top of EVERY page */
    }
    
    .print-brand {
      text-align: center;
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 4px;
      color: #ea580c;
    }
    
    .print-subtitle {
      text-align: center;
      font-size: 16px;
      color: #9a3412;
      margin-bottom: 24px;
      font-weight: 500;
      font-style: italic;
    }
    
    ul {
      list-style-type: none;
      padding: 0;
      border: 2px solid #fed7aa;
      border-radius: 8px;
      overflow: hidden;
      
      li {
        display: flex;
        align-items: center;
        font-size: 16px;
        padding: 12px 16px;
        border-bottom: 1px dashed #fed7aa;
        color: #431407;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:nth-child(even) {
          background-color: #fffdfa;
        }
        
        .print-checkbox {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 1.5px solid #f97316;
          background-color: #fff7ed;
          border-radius: 4px;
          margin-right: 12px;
        }
      }
    }
  }
}
  `]
})
export class MealPlannerComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  weekDays: WeekDayInfo[] = [];
  mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Dessert'];
  
  availableRecipes: Recipe[] = [];
  mealPlan: MealPlanEntry[] = [];
  mealGrid: Map<string, MealPlanEntry> = new Map();
  shoppingList: ShoppingListItem[] = [];
  
  private sub?: Subscription;

  constructor(
    private mealPlannerService: MealPlannerService,
    private recipeService: RecipeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.generateWeek();
    this.loadRecipes();
    this.sub = this.mealPlannerService.mealPlan$.subscribe(plan => {
      this.mealPlan = plan;
      
      // Update fast lookup grid
      this.mealGrid.clear();
      plan.forEach(m => this.mealGrid.set(`${m.date}-${m.mealType}`, m));
      
      this.updateShoppingList();
      this.cdr.detectChanges();
    });
  }
  
  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  generateWeek() {
    const start = startOfWeek(this.currentDate, { weekStartsOn: 1 });
    this.weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(start, i);
      return { date: d, iso: this.getISODate(d) };
    });
    this.updateShoppingList();
  }

  prevWeek() {
    this.currentDate = subWeeks(this.currentDate, 1);
    this.generateWeek();
  }

  nextWeek() {
    this.currentDate = addWeeks(this.currentDate, 1);
    this.generateWeek();
  }

  getISODate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  loadRecipes() {
    this.recipeService.getRecipes({ limit: 50 }).subscribe(res => {
      this.availableRecipes = res.recipes;
      this.updateShoppingList();
      this.cdr.detectChanges();
    });
  }

  getMeal(isoDate: string, type: MealType): MealPlanEntry | undefined {
    return this.mealGrid.get(`${isoDate}-${type}`);
  }

  onRecipeSelect(isoDate: string, type: MealType, recipeId: string) {
    if (!recipeId) return;
    
    const recipe = this.availableRecipes.find(r => r._id === recipeId);
    if (!recipe) return;

    const existing = this.getMeal(isoDate, type);
    if (existing) {
      this.mealPlannerService.removeMeal(existing.id);
    }

    // Add new entry
    const entry: MealPlanEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: isoDate,
      mealType: type,
      recipeId: recipe._id,
      targetServings: 2,
      recipeName: recipe.title,
      recipeBaseServings: 2
    };
    
    this.mealPlannerService.addMeal(entry);
  }

  removeMeal(id: string) {
    this.mealPlannerService.removeMeal(id);
  }

  updateShoppingList() {
    if (!this.weekDays.length) return;
    
    const start = this.weekDays[0].iso;
    const end = this.weekDays[6].iso;
    const weekPlan = this.mealPlannerService.getPlanForWeek(start, end);

    const fullEntries = weekPlan.map(entry => {
      const recipe = this.availableRecipes.find(r => r._id === entry.recipeId) || {
        _id: entry.recipeId,
        title: entry.recipeName || 'Unknown',
        ingredients: []
      } as unknown as Recipe;
      return { entry, recipe };
    });

    this.shoppingList = this.mealPlannerService.generateShoppingList(fullEntries);
  }

  toggleShoppingItem(item: ShoppingListItem) {
    item.isChecked = !item.isChecked;
  }
  
  printShoppingList() {
    window.print();
  }
}
