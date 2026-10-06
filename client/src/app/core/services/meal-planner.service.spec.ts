import { TestBed } from '@angular/core/testing';
import { MealPlannerService } from './meal-planner.service';
import { MealPlanEntry, MealType } from '../models/meal-plan';
import { Recipe } from '../models/types';

describe('MealPlannerService', () => {
  let service: MealPlannerService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MealPlannerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty plan if localStorage is empty', () => {
    const plan = service.getPlanForWeek('2000-01-01', '2000-01-07');
    expect(plan.length).toBe(0);
  });

  it('should add a meal correctly', () => {
    const newMeal: MealPlanEntry = {
      id: '1',
      date: '2023-01-01',
      mealType: 'Breakfast' as MealType,
      recipeId: '123',
      targetServings: 2
    };
    service.addMeal(newMeal);
    
    const plan = service.getPlanForWeek('2023-01-01', '2023-01-07');
    expect(plan.length).toBe(1);
    expect(plan[0].recipeId).toBe('123');
  });

  it('should remove a meal by ID', () => {
    const newMeal: MealPlanEntry = {
      id: 'meal1',
      date: '2023-01-01',
      mealType: 'Lunch' as MealType,
      recipeId: '123',
      targetServings: 2
    };
    service.addMeal(newMeal);
    let plan = service.getPlanForWeek('2023-01-01', '2023-01-07');
    expect(plan.length).toBe(1);
    
    service.removeMeal('meal1');
    
    plan = service.getPlanForWeek('2023-01-01', '2023-01-07');
    expect(plan.length).toBe(0);
  });

  it('should generate an aggregated shopping list', () => {
    const mockRecipe: Recipe = {
      _id: '123',
      title: 'Pasta',
      category: 'Dinner',
      ingredients: [
        { name: 'Pasta', quantity: '1 box' },
        { name: 'Tomato Sauce', quantity: '2 cups' }
      ],
      steps: []
    } as any;

    const mockEntry: MealPlanEntry = {
      id: 'm1',
      date: '2023-01-01',
      mealType: 'Dinner',
      recipeId: '123',
      targetServings: 4,
      recipeBaseServings: 2 // scales by 2x
    };

    const shoppingList = service.generateShoppingList([
      { entry: mockEntry, recipe: mockRecipe }
    ]);
    
    expect(shoppingList.length).toBe(2);
    const pastaItem = shoppingList.find(i => i.name.toLowerCase().includes('pasta'));
    expect(pastaItem).toBeTruthy();
    expect(pastaItem?.totalQuantity).toBe(2); // 1 box * 2x scale
  });
});
