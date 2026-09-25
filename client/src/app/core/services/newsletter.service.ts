import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  subscribe(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/newsletter/subscribe`, { email });
  }
}
