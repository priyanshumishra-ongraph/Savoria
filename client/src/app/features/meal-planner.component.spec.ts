import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MealPlannerComponent } from './meal-planner.component';
import { MealPlannerService } from '../core/services/meal-planner.service';
import { RecipeService } from '../core/services/recipe.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('MealPlannerComponent', () => {
  let component: MealPlannerComponent;
  let fixture: ComponentFixture<MealPlannerComponent>;
  let mockMealService: any;
  let mockRecipeService: any;
  
  let addedMeal: any;
  let removedMealId: any;

  beforeEach(async () => {
    addedMeal = null;
    removedMealId = null;

    mockMealService = {
      mealPlan$: of([]),
      getPlanForWeek: () => [],
      addMeal: (m: any) => { addedMeal = m; },
      removeMeal: (id: any) => { removedMealId = id; },
      generateShoppingList: () => []
    };

    mockRecipeService = {
      getRecipes: () => of({ recipes: [] })
    };

    await TestBed.configureTestingModule({
      imports: [MealPlannerComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: MealPlannerService, useValue: mockMealService },
        { provide: RecipeService, useValue: mockRecipeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MealPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load week days', () => {
    expect(component).toBeTruthy();
    expect(component.weekDays.length).toBe(7);
  });

  it('should map getMeal correctly from the fast lookup map', () => {
    component.mealGrid.set('2023-01-01-Breakfast', { id: '1', date: '2023-01-01', mealType: 'Breakfast', recipeId: '123', targetServings: 2 });
    const meal = component.getMeal('2023-01-01', 'Breakfast');
    expect(meal).toBeTruthy();
    expect(meal?.recipeId).toBe('123');
  });

  it('should trigger removeMeal on service', () => {
    component.removeMeal('123');
    expect(removedMealId).toBe('123');
  });
});
