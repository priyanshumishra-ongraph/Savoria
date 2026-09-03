import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-wrapper">
      <div class="form-card" [class.success-mode]="isSuccess">
        
        <!-- Registration Form -->
        <ng-container *ngIf="!isSuccess">
          <div class="card-accent"></div>
          <div class="form-header">
            <div class="header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            </div>
            <h2>Register New User</h2>
            <p>Create a new account for your team member</p>
          </div>

          <form (ngSubmit)="onSubmit()" #registerForm="ngForm" class="register-form">
            <div class="input-group">
              <label for="name">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Full Name
              </label>
              <input type="text" id="name" [(ngModel)]="user.name" name="name" placeholder="e.g. Akshat Sharma" required>
            </div>
            
            <div class="input-group">
              <label for="email">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Email Address
              </label>
              <input type="email" id="email" [(ngModel)]="user.email" name="email" placeholder="e.g. akshat&#64;savoria.com" required>
            </div>

            <div class="input-group">
              <label for="password">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Password
              </label>
              <input type="password" id="password" [(ngModel)]="user.password" name="password" placeholder="Min. 6 characters" required minlength="6">
            </div>

            <button type="submit" class="submit-btn" [disabled]="!registerForm.form.valid || isSubmitting">
              <ng-container *ngIf="!isSubmitting">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                Create Account
              </ng-container>
              <ng-container *ngIf="isSubmitting">
                <div class="spinner"></div>
                Creating Account...
              </ng-container>
            </button>

            <a routerLink="/recipes" class="back-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Recipes
            </a>
          </form>
          
          <div *ngIf="error" class="error-banner" (click)="error = ''">
            <div class="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <span>{{ errorMessage }}</span>
          </div>
        </ng-container>

        <!-- Success State -->
        <div *ngIf="isSuccess" class="success-state">
          <div class="confetti-wrapper">
            <div class="confetti c1"></div>
            <div class="confetti c2"></div>
            <div class="confetti c3"></div>
            <div class="confetti c4"></div>
            <div class="confetti c5"></div>
            <div class="confetti c6"></div>
          </div>

          <div class="success-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>

          <h2>Account Created!</h2>
          <p class="success-sub">{{ registeredName }} is all set to go</p>
          
          <div class="user-card">
            <div class="user-avatar">{{ getInitials(registeredName) }}</div>
            <div class="user-info">
              <strong>{{ registeredName }}</strong>
              <span>{{ registeredEmail }}</span>
            </div>
            <div class="user-role">User</div>
          </div>

          <div class="success-actions">
            <button class="submit-btn" (click)="resetForm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Register Another User
            </button>
            <a routerLink="/recipes" class="back-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Recipes
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 50px 20px;
      min-height: calc(100vh - 70px);
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .form-card {
      background: #ffffff;
      padding: 0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.08);
      width: 100%;
      max-width: 440px;
      overflow: hidden;
      position: relative;
      animation: slideUp 0.4s ease-out;
    }

    .card-accent {
      height: 5px;
      background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
    }

    .form-header {
      text-align: center;
      padding: 32px 40px 0;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      color: white;
    }

    .form-header h2 {
      margin: 0;
      color: #1a202c;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .form-header p {
      color: #a0aec0;
      margin: 6px 0 0;
      font-size: 14px;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 28px 40px 36px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-group label {
      font-size: 13px;
      font-weight: 600;
      color: #4a5568;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-group input {
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      transition: all 0.2s ease;
      outline: none;
      color: #2d3748;
      background: #f7fafc;
    }

    .input-group input::placeholder {
      color: #cbd5e0;
    }

    .input-group input:focus {
      border-color: #f97316;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
    }

    .submit-btn {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      margin-top: 4px;
    }

    .submit-btn:hover:not([disabled]) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
    }

    .submit-btn:active:not([disabled]) {
      transform: translateY(0);
    }

    .submit-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .back-link {
      color: #a0aec0;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: #f97316;
    }

    /* Spinner */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    /* Error Banner */
    .error-banner {
      margin: 0 40px 28px;
      padding: 12px 16px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
      background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
      color: #c53030;
      cursor: pointer;
      animation: shake 0.4s ease-in-out;
    }

    .error-icon {
      flex-shrink: 0;
    }

    /* ===== SUCCESS STATE ===== */
    .success-state {
      padding: 48px 40px 36px;
      text-align: center;
      position: relative;
      overflow: hidden;
      animation: fadeIn 0.5s ease-out;
    }

    .success-badge {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
      box-shadow: 0 8px 25px rgba(72, 187, 120, 0.35);
    }

    .success-state h2 {
      color: #1a202c;
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 6px;
      letter-spacing: -0.5px;
    }

    .success-sub {
      color: #a0aec0;
      font-size: 15px;
      margin: 0 0 24px;
    }

    /* User Card */
    .user-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      background: #f7fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 28px;
      text-align: left;
      animation: slideUp 0.4s ease-out 0.2s both;
    }

    .user-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-info strong {
      color: #2d3748;
      font-size: 15px;
    }

    .user-info span {
      color: #a0aec0;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      background: #edf2f7;
      color: #4a5568;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

    .success-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: slideUp 0.4s ease-out 0.3s both;
    }

    /* Confetti */
    .confetti-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    }

    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      opacity: 0;
      animation: confettiFall 2s ease-out forwards;
    }

    .c1 { left: 10%; background: #f97316; animation-delay: 0s; }
    .c2 { left: 25%; background: #fb923c; animation-delay: 0.1s; width: 8px; height: 8px; border-radius: 50%; }
    .c3 { left: 45%; background: #fdba74; animation-delay: 0.2s; }
    .c4 { left: 65%; background: #ea580c; animation-delay: 0.15s; width: 6px; height: 12px; }
    .c5 { left: 80%; background: #c2410c; animation-delay: 0.25s; border-radius: 50%; }
    .c6 { left: 90%; background: #fed7aa; animation-delay: 0.05s; }

    /* Animations */
    @keyframes slideUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    @keyframes popIn {
      0% { transform: scale(0); opacity: 0; }
      80% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    @keyframes confettiFall {
      0% { top: -10%; opacity: 1; transform: rotate(0deg) scale(1); }
      100% { top: 100%; opacity: 0; transform: rotate(720deg) scale(0.5); }
    }
  `]
})
export class UserRegistrationComponent {
  user = { name: '', email: '', password: '' };
  
  error = '';
  errorMessage = '';
  successMsg = '';
  registeredName = '';
  registeredEmail = '';
  isSubmitting = false;
  isSuccess = false;

  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onSubmit() {
    this.isSubmitting = true;
    this.error = '';
    this.errorMessage = '';

    this.registeredName = this.user.name;
    this.registeredEmail = this.user.email;

    this.authService.register(this.user).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSuccess = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || 'Failed to register user.';
        this.error = msg;
        this.errorMessage = msg === 'User already exists' 
          ? 'A user with this email already exists in the system.' 
          : msg;
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.user = { name: '', email: '', password: '' };
    this.isSuccess = false;
    this.error = '';
    this.errorMessage = '';
    this.registeredName = '';
    this.registeredEmail = '';
  }
}
