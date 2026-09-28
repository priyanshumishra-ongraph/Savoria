import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reviews`;

  getReviewsForRecipe(recipeId: string, sort: string = 'newest'): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/${recipeId}?sort=${sort}`);
  }

  addReview(recipeId: string, rating: number, comment: string, sentiment: string): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, { recipeId, rating, comment, sentiment });
  }

  deleteReview(reviewId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${reviewId}`);
  }

  toggleHelpful(reviewId: string): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/${reviewId}/helpful`, {});
  }

  addOwnerReply(reviewId: string, reply: string): Observable<Review> {
    return this.http.patch<Review>(`${this.apiUrl}/${reviewId}/reply`, { reply });
  }
}
