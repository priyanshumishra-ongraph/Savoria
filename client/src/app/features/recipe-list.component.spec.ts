import { ComponentFixture, TestBed, } from '@angular/core/testing';
import { RecipeListComponent } from './recipe-list.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RecipeService } from '../core/services/recipe.service';
import { of, BehaviorSubject } from 'rxjs';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RecipeListComponent', () => {
  let component: RecipeListComponent;
  let fixture: ComponentFixture<RecipeListComponent>;
  let mockRecipeService: any;
  let queryParamsSubject = new BehaviorSubject<any>({});

  beforeEach(async () => {
    mockRecipeService = {
      getRecipes: vi.fn().mockReturnValue(of({
        recipes: [
          { _id: '1', title: 'Recipe 1', category: 'Dinner', difficulty: 'Easy' },
          { _id: '2', title: 'Recipe 2', category: 'Lunch', difficulty: 'Medium' }
        ],
        total: 2,
        page: 1,
        pages: 1
      }))
    };

    const mockActivatedRoute = {
      queryParams: queryParamsSubject.asObservable(), snapshot: { queryParamMap: { get: (key: string) => null } }
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        RecipeListComponent
      ],
      providers: [
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load recipes on init', async () => {
    expect(component).toBeTruthy();
    await new Promise(r => setTimeout(r, 450));
    expect(mockRecipeService.getRecipes).toHaveBeenCalledWith('', '', 1, 12);
    expect(component.recipes.length).toBe(2);
  });

  it('should filter recipes when category changes', async () => {
    component.categoryControl.setValue('Dinner');
    await new Promise(r => setTimeout(r, 450));
    expect(mockRecipeService.getRecipes).toHaveBeenCalledWith('', 'Dinner', 1, 12);
  });

  it('should filter recipes when search changes', async () => {
    component.searchControl.setValue('pasta');
    await new Promise(r => setTimeout(r, 450));
    expect(mockRecipeService.getRecipes).toHaveBeenCalledWith('pasta', '', 1, 12);
  });
});
