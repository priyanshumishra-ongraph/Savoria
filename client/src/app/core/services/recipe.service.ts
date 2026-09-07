import { Injectable, inject } from "@angular/core";
import { Recipe, RecipeResponse } from "../models/types";
import { Observable } from "rxjs/internal/Observable";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/recipes`;
  
  getRecipes(search:string = '', category: string = '', page: number = 1, limit: number = 12): Observable<RecipeResponse> {
    let params = new HttpParams();
    if(search) params = params.set('search', search);
    if(category) params = params.set('category', category);
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());

    return this.http.get<RecipeResponse>(this.apiUrl, { params });
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

  getMyRecipes(): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(`${this.apiUrl}/my`);
  }

  updateRecipe(id: string, recipeData: any): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.apiUrl}/${id}`, recipeData);
  }

  deleteRecipe(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
