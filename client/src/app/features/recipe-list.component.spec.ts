import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeListComponent } from './recipe-list.component';
import { SearchService } from '../core/services/search.service';
import { AuthService } from '../core/services/auth.service';
import { of, firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';

describe('RecipeListComponent', () => {
  let component: RecipeListComponent;
  let fixture: ComponentFixture<RecipeListComponent>;
  let mockSearchService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockSearchService = {
      results$: of({ recipes: [], total: 0, page: 1, limit: 10 }),
      categories$: of([]),
      difficulties$: of([]),
      tags$: of([]),
      ingredients$: of([]),
      strictIngredients$: of(false),
      maxCookTime$: of(null),
      minRating$: of(0),
      setSearch: vi.fn(),
      setSort: vi.fn(),
      setCategory: vi.fn()
    };

    mockAuthService = {
      currentUser$: of(null)
    };

    await TestBed.configureTestingModule({
      imports: [RecipeListComponent],
      providers: [
        { provide: SearchService, useValue: mockSearchService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
    .overrideComponent(RecipeListComponent, {
      set: { schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize results$ from search service', async () => {
    const res = await firstValueFrom(component.results$);
    expect(res.recipes).toEqual([]);
    expect(res.total).toBe(0);
  });

  it('should trigger search on input', () => {
    component.onSearchInput('pasta');
    expect(mockSearchService.setSearch).toHaveBeenCalledWith('pasta');
  });

  it('should trigger sort', () => {
    component.onSort('newest');
    expect(mockSearchService.setSort).toHaveBeenCalledWith('newest');
  });

  it('should trigger search from voice result', () => {
    component.onVoiceResult('pizza');
    expect(mockSearchService.setSearch).toHaveBeenCalledWith('pizza');
  });
});
