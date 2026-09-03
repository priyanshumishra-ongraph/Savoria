import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to Savoria to discover and share amazing recipes.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div class="input-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" [(ngModel)]="email" name="email" placeholder="chef@savoria.com" required>
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <input type="password" id="password" [(ngModel)]="password" name="password" placeholder="••••••••" required>
          </div>

          <button type="submit" class="submit-btn" [disabled]="!loginForm.form.valid || isSubmitting">
            <span *ngIf="!isSubmitting">Sign In</span>
            <app-loading-spinner *ngIf="isSubmitting"></app-loading-spinner>
          </button>
        </form>

        <div *ngIf="error" class="error-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{{ error }}</span>
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
    }
    
    .login-card {
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      width: 100%;
      max-width: 420px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-header h2 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 700;
    }

    .login-header p {
      color: #7f8c8d;
      margin-top: 8px;
      font-size: 15px;
      line-height: 1.5;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-group label {
      font-size: 14px;
      font-weight: 600;
      color: #34495e;
    }

    .input-group input {
      padding: 12px 16px;
      border: 1px solid #dfe6e9;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.3s ease;
      outline: none;
    }

    .input-group input:focus {
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

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

    .submit-btn:hover:not([disabled]) {
      background-color: #d35400;
    }

    .submit-btn:active:not([disabled]) {
      transform: scale(0.98);
    }

    .submit-btn[disabled] {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }

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
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  isSubmitting = false;

  onSubmit() {
    this.isSubmitting = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error.message || 'Login failed';
      }
    });
  }
}
