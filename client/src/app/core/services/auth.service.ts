import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, User } from '../models/types';
import { environment } from '../../../environments/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (savedUser && token) {
        // Immediately hydrate from localStorage so the guard passes fast
        try {
          this.currentUserSubject.next(JSON.parse(savedUser));
        } catch {
          this.clearSession();
          return;
        }
        // Then validate the token against the real server in the background
        setTimeout(() => this.validateSession(), 0);
      } else {
        this.clearSession();
      }
    }
  }

  private validateSession() {
    this.http.get<User>(`${this.apiUrl}/me`).subscribe({
      next: (freshUser) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
        this.currentUserSubject.next(freshUser);
      },
      error: (err) => {
        // *** THE BUG WAS HERE ***
        // If the token is invalid/expired (e.g. server restarted, port changed),
        // we MUST clear the session. Failing silently leaves the user with a 
        // dead token that causes every protected API call to 401 and hang on "Loading..."
        console.warn('Session invalid, clearing:', err.status);
        this.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  login(credentials: LoginCredentials) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.setSession(res))
    );
  }

  register(userData: RegisterData) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  adminRegister(userData: RegisterData & { role?: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/admin-register`, userData);
  }

  getUsers() {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  deleteUser(id: string) {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  toggleUserActive(id: string) {
    return this.http.patch<{ isActive: boolean; message: string }>(`${this.apiUrl}/users/${id}/toggle-active`, {});
  }

  uploadImage(file: File, nameHint: string = '') {
    const formData = new FormData();
    if (nameHint) formData.append('title', nameHint);
    formData.append('image', file);
    return this.http.post<{ message: string; imageUrl: string }>(`${environment.apiUrl}/upload/avatars`, formData);
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
  }

  updatePreferences(preferences: Partial<NonNullable<User['notificationPreferences']>>) {
    return this.http.patch<User>(`${this.apiUrl}/me/preferences`, { notificationPreferences: preferences }).pipe(
      tap(updatedUser => {
        this.currentUserSubject.next(updatedUser);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      })
    );
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private setSession(res: AuthResponse) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', res.token);
      const user: User = { _id: res._id, name: res.name, email: res.email, role: res.role };
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }
}
