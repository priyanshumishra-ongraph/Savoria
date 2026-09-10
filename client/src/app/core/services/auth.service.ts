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

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (savedUser && token) {
        this.currentUserSubject.next(JSON.parse(savedUser));
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
        console.error('Session validation failed:', err);
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
