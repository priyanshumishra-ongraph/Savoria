import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner.component';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>Create an Account</h2>
          <p>Join Savoria to discover and share amazing recipes.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm" class="login-form">
          <div class="input-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              [(ngModel)]="name"
              name="name"
              placeholder="e.g. Gordon Ramsay"
              required
              minlength="3"
              maxlength="100"
              #nameRef="ngModel">
            <span class="field-error" *ngIf="nameRef.invalid && nameRef.touched">
              Name is required (min 3 chars).
            </span>
          </div>

          <div class="input-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="email"
              name="email"
              placeholder="chef@savoria.com"
              required
              email
              #emailRef="ngModel">
            <span class="field-error" *ngIf="emailRef.invalid && emailRef.touched">
              Please enter a valid email address.
            </span>
          </div>

          <div class="input-group">
            <label>Avatar Image (Optional)</label>
            <div style="display: flex; gap: 12px; align-items: center; background: #f9fafb; padding: 12px 16px; border: 1px solid #dfe6e9; border-radius: 8px;">
              <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display: none;">
              <button type="button" (click)="fileInput.click()" [disabled]="isUploadingImage" style="background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                {{ avatarUrl ? 'Change Image' : 'Upload Image' }}
              </button>
              <div *ngIf="isUploadingImage" class="spinner" style="border-top-color: #3498db;"></div>
              <img *ngIf="avatarUrl && !isUploadingImage" [src]="getImageUrl(avatarUrl)" alt="Avatar Preview" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-left: auto;">
            </div>
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
              minlength="6"
              #passwordRef="ngModel">
            <span class="field-error" *ngIf="passwordRef.invalid && passwordRef.touched">
              Password must be at least 6 characters.
            </span>
          </div>

          <button type="submit" class="submit-btn" [disabled]="!registerForm.form.valid || isSubmitting || isUploadingImage">
            <span *ngIf="!isSubmitting">Sign Up</span>
            <app-loading-spinner *ngIf="isSubmitting"></app-loading-spinner>
          </button>
        </form>

        <div *ngIf="error" class="error-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{{ error }}</span>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 14px; color: #7f8c8d;">
          Already have an account? <a routerLink="/login" style="color: #3498db; text-decoration: none; font-weight: 600;">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 80px);
      background-color: #f4f6f8;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px 0;
    }
    .login-card {
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      width: 100%;
      max-width: 420px;
    }
    .login-header { text-align: center; margin-bottom: 30px; }
    .login-header h2 { margin: 0; color: #2c3e50; font-size: 28px; font-weight: 700; }
    .login-header p { color: #7f8c8d; margin-top: 8px; font-size: 15px; line-height: 1.5; }
    .login-form { display: flex; flex-direction: column; gap: 20px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label { font-size: 14px; font-weight: 600; color: #34495e; }
    .input-group input {
      padding: 12px 16px;
      border: 1px solid #dfe6e9;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.3s ease;
      outline: none;
    }
    .input-group input:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.1); }
    .input-group input.ng-invalid.ng-touched { border-color: #e74c3c; }
    .field-error { font-size: 12px; color: #e74c3c; font-weight: 500; }
    .submit-btn {
      background-color: #e67e22;
      color: white;
      border: none;
      padding: 14px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.1s;
      margin-top: 10px;
    }
    .submit-btn:hover:not([disabled]) { background-color: #d35400; }
    .submit-btn:active:not([disabled]) { transform: scale(0.98); }
    .submit-btn[disabled] { background-color: #bdc3c7; cursor: not-allowed; }
    .error-banner {
      margin-top: 25px;
      padding: 12px 15px;
      background-color: #fdeaea;
      border-left: 4px solid #e74c3c;
      color: #c0392b;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(0,0,0,0.1);
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  name = '';
  email = '';
  password = '';
  avatarUrl = '';
  error = '';
  isSubmitting = false;
  isUploadingImage = false;

  getImageUrl(url: string | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}${url}`;
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const nameHint = this.name;
    if (file) {
      this.isUploadingImage = true;
      this.error = '';
      this.cdr.detectChanges();
      this.authService.uploadImage(file, nameHint).subscribe({
        next: (res) => {
          this.avatarUrl = res.imageUrl;
          this.isUploadingImage = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to upload image';
          this.isUploadingImage = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSubmit() {
    this.isSubmitting = true;
    this.error = '';
    
    this.authService.register({ 
      name: this.name, 
      email: this.email, 
      password: this.password,
      avatarUrl: this.avatarUrl
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.error = err.error?.message || (err.error?.errors && err.error.errors[0]?.msg) || 'Registration failed. Please try again.';
      }
    });
  }
}
