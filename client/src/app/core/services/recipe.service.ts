import { Injectable, inject } from "@angular/core";
import { RecipeResponse } from "../models/types";
import { Observable } from "rxjs/internal/Observable";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/recipes`;
  
  getRecipes(params?: any): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(this.apiUrl, { params });
  }

  getMyRecipes(): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(`${this.apiUrl}/my`);
  }

  createRecipe(recipeData: any): Observable<any> {
    return this.http.post(this.apiUrl, recipeData);
  }
}
