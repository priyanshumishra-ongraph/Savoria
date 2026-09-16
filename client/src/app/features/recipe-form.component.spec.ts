import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeFormComponent } from './recipe-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../core/services/recipe.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RecipeFormComponent', () => {
  let component: RecipeFormComponent;
  let fixture: ComponentFixture<RecipeFormComponent>;
  let mockRecipeService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockRecipeService = {
      getRecipe: vi.fn().mockReturnValue(of({
        title: 'Test Recipe',
        description: 'Test Desc',
        difficulty: 'Easy',
        category: 'Dinner',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        ingredients: [{ name: 'Ingredient 1', quantity: '1 cup' }],
        steps: ['Step 1'],
        tags: ['test']
      })),
      createRecipe: vi.fn().mockReturnValue(of({ slug: 'test-recipe', title: 'New Recipe', category: 'Dinner' })),
      updateRecipe: vi.fn().mockReturnValue(of({ slug: 'updated-recipe', title: 'Updated Recipe', category: 'Dinner' }))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => null // default to create mode
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        RecipeFormComponent
      ],
      providers: [
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form as invalid', () => {
    expect(component.recipeForm.valid).toBe(false);
  });

  it('should initialize form as valid when filled', () => {
    component.recipeForm.patchValue({
      title: 'Valid Recipe',
      category: 'Dinner',
      difficulty: 'Easy',
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      ingredientsText: 'Salt',
      stepsText: 'Mix'
    });
    
    
    expect(component.recipeForm.valid).toBe(true);
  });

  it('should call createRecipe on submit in create mode', () => {
    component.recipeForm.patchValue({
      title: 'New Recipe',
      category: 'Dinner',
      difficulty: 'Easy',
      ingredientsText: 'Salt',
      stepsText: 'Mix'
    });
    

    component.onSubmit();
    expect(mockRecipeService.createRecipe).toHaveBeenCalled();
  });
});
