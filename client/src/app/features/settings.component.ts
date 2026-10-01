import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and notifications.</p>
      </div>

      <div class="settings-section">
        <h2>Notification Preferences</h2>
        <p class="section-desc">Choose which alerts you'd like to receive in your notification bell.</p>

        <div class="preference-list" *ngIf="preferences">
          <label class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">New Reviews</span>
              <span class="toggle-desc">When someone leaves a review on your recipe</span>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" [(ngModel)]="preferences.onReview" (change)="savePreferences()">
              <span class="slider"></span>
            </div>
          </label>

          <label class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Recipe Saves</span>
              <span class="toggle-desc">When someone adds your recipe to their cookbook</span>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" [(ngModel)]="preferences.onSave" (change)="savePreferences()">
              <span class="slider"></span>
            </div>
          </label>

          <label class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Review Replies</span>
              <span class="toggle-desc">When a recipe owner replies to a review you left</span>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" [(ngModel)]="preferences.onReply" (change)="savePreferences()">
              <span class="slider"></span>
            </div>
          </label>

          <label class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Helpful Votes</span>
              <span class="toggle-desc">When someone finds your review helpful</span>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" [(ngModel)]="preferences.onHelpful" (change)="savePreferences()">
              <span class="slider"></span>
            </div>
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding-top: 30px;
      background-color: #fafaf9;
    }

    .settings-container {
      max-width: 1200px;
      margin: 0 auto 60px auto;
      padding: 0 24px;
    }

    .settings-header {
      margin-bottom: 32px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 24px;
    }

    .settings-header h1 {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      color: #3C2218;
      margin: 0 0 8px 0;
    }

    .settings-header p {
      color: #64748b;
      margin: 0;
      font-size: 16px;
    }

    .settings-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .settings-section h2 {
      font-size: 20px;
      color: #0f172a;
      margin: 0 0 8px 0;
    }

    .section-desc {
      color: #64748b;
      font-size: 14px;
      margin: 0 0 24px 0;
    }

    .preference-list {
      display: flex;
      flex-direction: column;
    }

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
    }
    
    .toggle-row:last-child {
      border-bottom: none;
    }

    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toggle-title {
      font-weight: 600;
      color: #1e293b;
    }

    .toggle-desc {
      font-size: 13px;
      color: #64748b;
    }

    /* iOS Style Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #cbd5e1;
      transition: .3s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    input:checked + .slider {
      background-color: #ea580c;
    }

    input:checked + .slider:before {
      transform: translateX(24px);
    }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  preferences = {
    onReview: true,
    onSave: true,
    onReply: true,
    onHelpful: true
  };

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user?.notificationPreferences) {
        this.preferences = { ...user.notificationPreferences };
      }
    });
  }

  savePreferences() {
    this.authService.updatePreferences(this.preferences).subscribe({
      next: () => {
        this.snackBar.open('Preferences saved!', 'Close', { duration: 2000, horizontalPosition: 'center', verticalPosition: 'bottom' });
      },
      error: () => {
        this.snackBar.open('Failed to save preferences', 'Close', { duration: 3000 });
      }
    });
  }
}
