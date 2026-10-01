import { Injectable, inject } from "@angular/core";
import { Recipe, RecipeResponse, SearchParams } from "../models/types";
import { Observable } from "rxjs/internal/Observable";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/recipes`;
  
  getRecipes(params: SearchParams = {}): Observable<RecipeResponse> {
    let p = new HttpParams();
    if (params.search)      p = p.set('search', params.search);
    if (params.category)    p = p.set('category', params.category);
    if (params.ingredients) p = p.set('ingredients', params.ingredients);
    if (params.maxCookTime != null) p = p.set('maxCookTime', params.maxCookTime.toString());
    if (params.minRating   != null) p = p.set('minRating',   params.minRating.toString());
    if (params.sort)        p = p.set('sort', params.sort);
    p = p.set('page',  (params.page  ?? 1).toString());
    p = p.set('limit', (params.limit ?? 12).toString());
    return this.http.get<RecipeResponse>(this.apiUrl, { params: p });
  }

  getTrending(): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(`${this.apiUrl}/trending`);
  }

  getRecommended(): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(`${this.apiUrl}/recommended`);
  }

  getSimilar(id: string): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(`${this.apiUrl}/${id}/similar`);
  }

  getRecipeById(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/${id}`);
  }

  getRecipeBySlug(category: string, titleSlug: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/by-slug/${category}/${titleSlug}`);
  }

  createRecipe(recipeData: any): Observable<Recipe> {
    return this.http.post<Recipe>(this.apiUrl, recipeData);
  }

  getMyRecipes(page: number = 1, limit: number = 6): Observable<RecipeResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<RecipeResponse>(`${this.apiUrl}/my`, { params });
  }

  updateRecipe(id: string, recipeData: any): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.apiUrl}/${id}`, recipeData);
  }

  deleteRecipe(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadImage(file: File, title: string = ''): Observable<{ message: string; imageUrl: string }> {
    const formData = new FormData();
    if (title) formData.append('title', title);
    formData.append('image', file);
    return this.http.post<{ message: string; imageUrl: string }>(`${environment.apiUrl}/upload/recipes`, formData);
  }
}
