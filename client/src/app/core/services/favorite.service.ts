import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/favorites`;

  private favoriteIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  favoriteIds$ = this.favoriteIdsSubject.asObservable();

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.favorites) {
        this.favoriteIdsSubject.next(new Set(user.favorites));
      } else {
        this.favoriteIdsSubject.next(new Set());
      }
    });
  }

  getFavorites(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addFavorite(recipeId: string): Observable<{ message: string, favorites: string[] }> {
    return this.http.post<{ message: string, favorites: string[] }>(`${this.apiUrl}/${recipeId}`, {}).pipe(
      tap(res => {
        const current = new Set(this.favoriteIdsSubject.value);
        current.add(recipeId);
        this.favoriteIdsSubject.next(current);
        
        // Update auth service user state hack
        const user = this.authService.currentUserValue;
        if (user) {
          user.favorites = res.favorites;
          (this.authService as any).currentUserSubject.next(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
      })
    );
  }

  removeFavorite(recipeId: string): Observable<{ message: string, favorites: string[] }> {
    return this.http.delete<{ message: string, favorites: string[] }>(`${this.apiUrl}/${recipeId}`).pipe(
      tap(res => {
        const current = new Set(this.favoriteIdsSubject.value);
        current.delete(recipeId);
        this.favoriteIdsSubject.next(current);

        const user = this.authService.currentUserValue;
        if (user) {
          user.favorites = res.favorites;
          (this.authService as any).currentUserSubject.next(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
      })
    );
  }
}
