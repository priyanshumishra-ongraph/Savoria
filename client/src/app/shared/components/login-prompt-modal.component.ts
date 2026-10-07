import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-prompt-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="login-modal-container">
      <h2 mat-dialog-title class="modal-title playfair">Login Required</h2>
      <mat-dialog-content class="modal-content">
        <div class="icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <p class="modal-text">Please login to continue and access this feature.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="center" class="modal-actions">
        <button mat-button mat-dialog-close (click)="goBack()" class="back-btn">Go Back</button>
        <button mat-flat-button (click)="goToLogin()" class="login-btn">Login / Register</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .login-modal-container {
      padding: 10px;
      background: white;
      text-align: center;
    }
    .modal-title {
      color: #3C2218;
      font-size: 24px;
      margin-bottom: 8px;
      text-align: center;
    }
    .modal-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
    }
    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #fff7ed;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 16px auto 24px;
    }
    .modal-text {
      color: #4a5568;
      font-size: 16px;
      margin-bottom: 16px;
      text-align: center;
    }
    .modal-actions {
      padding: 0 16px 16px;
      justify-content: center;
      gap: 12px;
    }
    .back-btn {
      color: #718096;
      border-radius: 10px;
    }
    .login-btn {
      background-color: #ea580c !important;
      color: white !important;
      border-radius: 10px;
      padding: 0 24px;
    }
  `]
})
export class LoginPromptModalComponent {
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<LoginPromptModalComponent>);

  goToLogin() {
    this.dialogRef.close();
    this.router.navigate(['/login']);
  }

  goBack() {
    this.dialogRef.close();
  }
}
