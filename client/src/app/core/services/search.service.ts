import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, switchMap, tap, catchError, of, from, map } from 'rxjs';
import { RecipeService } from './recipe.service';
import { EmbeddingService } from './embedding.service';
import { SearchParams, RecipeResponse } from '../models/types';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private recipeService = inject(RecipeService);
  private embeddingService = inject(EmbeddingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly searchTerm$    = new BehaviorSubject<string>('');
  readonly categories$    = new BehaviorSubject<string[]>([]);
  readonly difficulties$  = new BehaviorSubject<string[]>([]);
  readonly tags$          = new BehaviorSubject<string[]>([]);
  readonly ingredients$   = new BehaviorSubject<string[]>([]);
  readonly strictIngredients$ = new BehaviorSubject<boolean>(false);
  readonly maxCookTime$   = new BehaviorSubject<number | null>(null);
  readonly minRating$     = new BehaviorSubject<number>(0);
  readonly sort$          = new BehaviorSubject<SearchParams['sort']>('newest');
  readonly page$          = new BehaviorSubject<number>(1);
  readonly loading$       = new BehaviorSubject<boolean>(false);

  private debouncedText$ = this.searchTerm$.pipe(
    debounceTime(400),
    distinctUntilChanged()
  );

  constructor() {
    this.embeddingService.init();
    
    // Subscribe to query params to initialize state
    this.route.queryParams.subscribe(params => {
      const currentSearch = this.searchTerm$.value;
      if (params['search'] && params['search'] !== currentSearch) {
        this.searchTerm$.next(params['search']);
      }
      if (params['categories']) this.categories$.next(params['categories'].split(','));
      if (params['difficulties']) this.difficulties$.next(params['difficulties'].split(','));
      if (params['tags']) this.tags$.next(params['tags'].split(','));
      if (params['ingredients']) this.ingredients$.next(params['ingredients'].split(','));
      if (params['strict']) this.strictIngredients$.next(params['strict'] === 'true');
      if (params['maxCookTime']) this.maxCookTime$.next(parseInt(params['maxCookTime'], 10));
      if (params['minRating']) this.minRating$.next(parseFloat(params['minRating']));
      if (params['sort']) this.sort$.next(params['sort'] as any);
      if (params['page']) this.page$.next(parseInt(params['page'], 10));
    });

    // Update URL when search changes (debounced to avoid race conditions with fast typing)
    this.debouncedText$.subscribe(val => {
      this.updateUrl({ search: val || null, page: 1 });
    });
  }

  // Update URL whenever filters change
  private updateUrl(params: any) {
    const currentPath = this.router.url.split('?')[0];
    this.router.navigate([currentPath], {
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  // Setters
  setSearch(val: string) { 
    if (this.searchTerm$.value !== val) {
      this.searchTerm$.next(val); 
    }
  }
  setCategories(val: string[]) { this.categories$.next(val); this.updateUrl({ categories: val.length ? val.join(',') : null, page: 1 }); }
  setDifficulties(val: string[]) { this.difficulties$.next(val); this.updateUrl({ difficulties: val.length ? val.join(',') : null, page: 1 }); }
  setTags(val: string[]) { this.tags$.next(val); this.updateUrl({ tags: val.length ? val.join(',') : null, page: 1 }); }
  setIngredients(val: string[]) { this.ingredients$.next(val); this.updateUrl({ ingredients: val.length ? val.join(',') : null, page: 1 }); }
  setStrictIngredients(val: boolean) { this.strictIngredients$.next(val); this.updateUrl({ strict: val ? 'true' : null, page: 1 }); }
  setMaxCookTime(val: number | null) { this.maxCookTime$.next(val); this.updateUrl({ maxCookTime: val || null, page: 1 }); }
  setMinRating(val: number) { this.minRating$.next(val); this.updateUrl({ minRating: val || null, page: 1 }); }
  setSort(val: SearchParams['sort']) { this.sort$.next(val); this.updateUrl({ sort: val !== 'newest' ? val : null, page: 1 }); }
  nextPage(page: number) { this.page$.next(page); this.updateUrl({ page: page > 1 ? page : null }); }

  clearAll() {
    this.categories$.next([]);
    this.difficulties$.next([]);
    this.tags$.next([]);
    this.ingredients$.next([]);
    this.strictIngredients$.next(false);
    this.maxCookTime$.next(null);
    this.minRating$.next(0);

    this.updateUrl({
      categories: null,
      difficulties: null,
      tags: null,
      ingredients: null,
      strict: null,
      maxCookTime: null,
      minRating: null,
      page: 1
    });
  }

  readonly results$ = combineLatest([
    this.debouncedText$,
    this.categories$,
    this.difficulties$,
    this.tags$,
    this.ingredients$,
    this.strictIngredients$,
    this.maxCookTime$,
    this.minRating$,
    this.sort$,
    this.page$,
  ]).pipe(
    tap(() => this.loading$.next(true)),
    switchMap(([search, categories, difficulties, tags, ingredients, strictIngredients, maxCookTime, minRating, sort, page]) => {
      const fetchLimit = search ? 36 : 12;

      const params: any = { sort, page, limit: fetchLimit };
      if (search) params.search = search;
      if (categories.length) params.category = categories.join(',');
      if (difficulties.length) params.difficulty = difficulties.join(',');
      if (tags.length) params.tags = tags.join(',');
      if (ingredients.length) {
        params.ingredients = ingredients.join(',');
        if (strictIngredients) params.strictIngredients = 'true';
      }
      if (maxCookTime) params.maxCookTime = maxCookTime;
      if (minRating) params.minRating = minRating;

      const req$ = this.recipeService.getRecipes(params).pipe(
        catchError(() => of({ recipes: [], total: 0, pages: 1 } as RecipeResponse))
      );

      if (!search) return req$;

      return req$.pipe(
        switchMap(res => from(this.rankSemantically(search, res)))
      );
    }),
    tap(() => this.loading$.next(false))
  );

  private async rankSemantically(query: string, response: RecipeResponse): Promise<RecipeResponse> {
    if (!response.recipes.length) return response;
    
    try {
      const targetVec = await this.embeddingService.embedText(query);
      if (!targetVec.length) return response;

      const candidates = await Promise.all(
        response.recipes.map(async r => {
          const text = `${r.title} ${r.description || ''} ${r.steps?.join(' ') || ''} ${r.ingredients?.map((i: any) => i.name).join(' ') || ''}`;
          return { id: r._id, vec: await this.embeddingService.embedText(text) };
        })
      );

      const ranked = await this.embeddingService.rankSimilar(targetVec, candidates);
      if (ranked.length > 0) {
        const idOrder = ranked.map(r => r.id);
        const sortedRecipes = idOrder.map(id => response.recipes.find(r => r._id === id)!).filter(Boolean);
        
        return {
          recipes: sortedRecipes.slice(0, 12),
          total: response.total,
          page: response.page,
          pages: Math.ceil(response.total / 12)
        };
      }
    } catch(e) {
      console.error('Semantic ranking failed, falling back to standard search', e);
    }
    return response;
  }
}