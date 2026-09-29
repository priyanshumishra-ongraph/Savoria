import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Collection, CollectionResponse } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/collections`;

  getCollections(page = 1, limit = 10): Observable<CollectionResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('_t', Date.now().toString()); // Cache buster
    return this.http.get<CollectionResponse>(this.apiUrl, { params }).pipe(
      map(res => {
        if (res.collections) {
          res.collections.forEach(col => {
            if (col.recipes) col.recipes = col.recipes.filter(r => !!r);
          });
        }
        return res;
      })
    );
  }

  getCollectionById(id: string): Observable<Collection> {
    let params = new HttpParams().set('_t', Date.now().toString());
    return this.http.get<Collection>(`${this.apiUrl}/${id}`, { params }).pipe(
      map(col => {
        if (col && col.recipes) col.recipes = col.recipes.filter(r => !!r);
        return col;
      })
    );
  }

  getSharedCollection(token: string): Observable<Collection> {
    return this.http.get<Collection>(`${this.apiUrl}/shared/${token}`);
  }

  createCollection(data: { name: string; isPublic?: boolean }): Observable<Collection> {
    return this.http.post<Collection>(this.apiUrl, data);
  }

  updateCollection(id: string, data: { name?: string; isPublic?: boolean; coverImage?: string }): Observable<Collection> {
    return this.http.put<Collection>(`${this.apiUrl}/${id}`, data);
  }

  deleteCollection(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  addRecipeToCollection(collectionId: string, recipeId: string): Observable<Collection> {
    return this.http.post<Collection>(`${this.apiUrl}/${collectionId}/recipes`, { recipeId });
  }

  removeRecipeFromCollection(collectionId: string, recipeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${collectionId}/recipes/${recipeId}`);
  }

  addCollaborator(collectionId: string, email: string): Observable<Collection> {
    return this.http.post<Collection>(`${this.apiUrl}/${collectionId}/collaborators`, { email });
  }

  removeCollaborator(collectionId: string, userId: string): Observable<Collection> {
    return this.http.delete<Collection>(`${this.apiUrl}/${collectionId}/collaborators/${userId}`);
  }
}
