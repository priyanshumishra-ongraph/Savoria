import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from "@angular/core";
import { isPlatformBrowser, CommonModule } from "@angular/common";
import { environment } from '../../environments/environment';
import { FormsModule } from "@angular/forms";
import { AuthService } from "../core/services/auth.service";
import { User } from "../core/models/types";
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner.component';
import { ConfirmationModalComponent } from '../shared/components/confirmation-modal.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ViewChild, AfterViewInit } from '@angular/core';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LoadingSpinnerComponent, ConfirmationModalComponent,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule,
    MatPaginatorModule, MatSelectModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div class="header-content">
          <div class="title-area">
            <h2>Registered Users</h2>
            <p>Manage the members of your platform</p>
          </div>
          <button class="create-btn" (click)="openRegisterModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Register User
          </button>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="users-table-container mat-elevation-z2">
          <table mat-table [dataSource]="dataSource" class="full-width-table">
            
            <!-- Avatar Column -->
            <ng-container matColumnDef="avatar">
              <th mat-header-cell *matHeaderCellDef> Avatar </th>
              <td mat-cell *matCellDef="let u">
                <div class="avatar-only">
                  <div class="avatar" *ngIf="!u.avatarUrl || u.avatarUrl === 'default-avatar.png'">{{ getInitials(u.name) }}</div>
                  <img class="avatar-img" *ngIf="u.avatarUrl && u.avatarUrl !== 'default-avatar.png'" [src]="getImageUrl(u.avatarUrl)" alt="Avatar">
                </div>
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Name </th>
              <td mat-cell *matCellDef="let u" class="user-name-text"> {{ u.name }} </td>
            </ng-container>

            <!-- Username Column -->
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef> Username </th>
              <td mat-cell *matCellDef="let u" class="user-email-text"> {{ u.email }} </td>
            </ng-container>

            <!-- Password Column -->
            <ng-container matColumnDef="password">
              <th mat-header-cell *matHeaderCellDef> Password </th>
              <td mat-cell *matCellDef="let u">
                <span class="password-mask">••••••••</span>
              </td>
            </ng-container>

            <!-- Role Column -->
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef> Role </th>
              <td mat-cell *matCellDef="let u">
                <span class="role-badge" [ngClass]="u.role">{{ u.role }}</span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-col"> Actions </th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button style="color: red;" (click)="deleteUser(u._id, u.name)" title="Delete User">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <!-- Created At Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef> Created At </th>
              <td mat-cell *matCellDef="let u" class="date-text"> {{ u.createdAt | date:'medium' }} </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [pageSize]="2" [pageSizeOptions]="[2, 5, 10, 20]" showFirstLastButtons></mat-paginator>
        </div>
      </div>

      <div class="success-toast" *ngIf="successMessage">
        {{ successMessage }}
      </div>

      <!-- Registration Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
  
          
          <div *ngIf="!isSuccess; else successState">
            <div class="modal-header">
              <h3>Register New User</h3>
              <p>Add a new member to the community</p>
            </div>

            <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="modal-form" style="display: flex; flex-direction: column; gap: 8px;">
              <mat-form-field appearance="outline">
                <mat-label>Full Name</mat-label>
                <input matInput type="text" id="name" [(ngModel)]="newUser.name" name="name" required placeholder="John Doe">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email Address</mat-label>
                <input matInput type="email" id="email" [(ngModel)]="newUser.email" name="email" required placeholder="john@example.com">
              </mat-form-field>

              <div class="input-group" style="margin-bottom: 16px;">
                <label>Avatar Image (Optional)</label>
                <div style="display: flex; gap: 12px; align-items: center;">
                  <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display: none;">
                  <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="isUploadingImage">
                    <mat-icon>cloud_upload</mat-icon>
                    {{ newUser.avatarUrl ? 'Change Image' : 'Upload Image' }}
                  </button>
                  <mat-spinner *ngIf="isUploadingImage" diameter="24" style="display: inline-block;"></mat-spinner>
                  <img *ngIf="newUser.avatarUrl && !isUploadingImage" [src]="getImageUrl(newUser.avatarUrl)" alt="Avatar Preview" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
                </div>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select id="role" [(ngModel)]="newUser.role" name="role" required>
                  <mat-option value="user">User</mat-option>
                  <mat-option value="admin">Admin</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput [type]="showRegPassword ? 'text' : 'password'" id="password" [(ngModel)]="newUser.password" name="password" required minlength="6">
                <button mat-icon-button matSuffix (click)="showRegPassword = !showRegPassword" type="button">
                  <mat-icon>{{showRegPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
              </mat-form-field>

              <div *ngIf="error" class="error-banner">
                {{ error }}
              </div>

              <div style="display: flex; gap: 12px; margin-top: 8px;">
                <button type="button" class="cancel-btn" (click)="closeModal()" style="flex: 1;">
                  Cancel
                </button>
                <button class="submit-btn" type="submit" [disabled]="!regForm.form.valid || isSubmitting" style="flex: 1; gap: 8px;">
                  <span *ngIf="!isSubmitting">Register User</span>
                  <app-loading-spinner *ngIf="isSubmitting"></app-loading-spinner>
                </button>
              </div>
            </form>
          </div>

          <ng-template #successState>
            <div class="success-state">
              <div class="success-badge">✓</div>
              <h2>Registration Complete</h2>
              <p class="success-sub">The user has been successfully registered.</p>
              
              <div class="user-card">
                <ng-container *ngIf="registeredAvatarUrl && registeredAvatarUrl !== 'default-avatar.png'; else initialAvatar">
                  <img class="user-avatar" style="padding: 0; object-fit: cover; background: none;" [src]="getImageUrl(registeredAvatarUrl)" alt="Avatar">
                </ng-container>
                <ng-template #initialAvatar>
                  <div class="user-avatar">{{ getInitials(registeredName) }}</div>
                </ng-template>
                
                <div class="user-info">
                  <strong>{{ registeredName }}</strong>
                  <span>{{ registeredEmail }}</span>
                </div>
              </div>
              <div style="display: flex; gap: 12px; margin-top: 8px;">
               <button type="button" class="cancel-btn" (click)="closeModal()" style="flex: 1;">
                  Close
                </button>
              <button class="submit-btn" (click)="resetForm()" style="flex: 1;">Register Another</button>
            </div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Reusable Confirmation Modal -->
    <app-confirmation-modal
      [isOpen]="showDeleteConfirm"
      title="Delete User"
      [message]="'Are you sure you want to completely delete ' + userToDelete?.name + '\\'s account? This action cannot be undone.'"
      confirmText="Delete"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()">
    </app-confirmation-modal>
  `,
  styles: [`
    .dashboard-wrapper {
      background-color: #faf5eb;
      min-height: calc(100vh - 70px);
      font-family: 'Inter', 'Segoe UI', sans-serif;
      padding-bottom: 60px;
    }

    .dashboard-header {
      background-color: transparent;
      padding: 30px 20px;
      border-bottom: 1px solid #edf2f7;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .header-content {
      max-width: 100%;
      padding: 0 40px;
      margin: 0 auto;
      max-width: 1200px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-area h2 {
      margin: 0 0 4px;
      font-size: 26px;
      font-weight: 800;
      color: #3C2218;
    }
    .title-area p {
      margin: 0;
      color: #718096;
      font-size: 15px;
    }

    .create-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
      transition: all 0.2s;
    }
    .create-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
    }

    .dashboard-content {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 40px;
    }

    .users-table-container {
      background-color: transparent;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.04);
      border: 1px solid #edf2f7;
      overflow: hidden;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table th, .users-table td {
      padding: 16px 24px;
      text-align: left;
      border-bottom: 1px solid #edf2f7;
    }

    .users-table th {
      background: #f7fafc;
      font-size: 13px;
      font-weight: 600;
      color: #4a5568;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .users-table tbody tr:last-child td {
      border-bottom: none;
    }

    .avatar-only {
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      object-fit: cover;
    }

    .user-name-text {
      font-weight: 600;
      color: #2d3748;
      font-size: 15px;
    }

    .user-email-text {
      color: #718096;
      font-size: 14px;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .role-badge.admin {
      background: #fed7d7;
      color: #c53030;
    }
    .role-badge.user {
      background: #edf2f7;
      color: #4a5568;
    }

    .password-mask {
      color: #a0aec0;
      letter-spacing: 2px;
      font-size: 18px;
      line-height: 1;
    }

    /* Modal Styles */
    .full-width-table {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .mat-elevation-z2 {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.1); /* warmer shadow */
    }

    .full-width-table mat-header-row, .full-width-table tr.mat-header-row {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    }

    .full-width-table mat-header-cell, .full-width-table th.mat-header-cell {
      font-size: 14px;
      font-weight: 700;
      color: white;
      border-bottom: none;
      background: transparent;
    }

    mat-cell {
      font-size: 14px;
      color: #3C2218;
    }
    
    .full-width-table .mat-mdc-row:nth-child(odd), .full-width-table tr.mat-row:nth-child(odd) {
      background-color: #ffffff;
    }

    .full-width-table .mat-mdc-row:nth-child(even), .full-width-table tr.mat-row:nth-child(even) {
      background-color: #fff7ed;
    }
    
    .full-width-table .mat-mdc-row:hover, .full-width-table tr.mat-row:hover {
      background-color: #ffedd5 !important;
      transition: background-color 0.2s ease;
    }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s;
    }

    .modal-content {
      background-color: white;
      border-radius: 24px;
      width: calc(100% - 32px);
      max-width: 450px;
      padding: 32px;
      position: relative;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-sizing: border-box;
      max-height: 90vh;
      overflow-y: auto;
    }

    .close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      font-size: 28px;
      color: #a0aec0;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .close-btn:hover { color: #2d3748; }

    .modal-header h3 {
      margin: 0 0 4px;
      font-size: 24px;
      color: #1a202c;
    }
    .modal-header p {
      margin: 0 0 24px;
      color: #718096;
      font-size: 14px;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .input-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 6px;
    }
    .input-group input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      background: #f7fafc;
      box-sizing: border-box;
      outline: none;
      transition: all 0.2s;
    }
    .input-group input:focus {
      border-color: #f97316;
      background-color: transparent;
    }

    .submit-btn {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      border: 1px solid transparent;
      padding: 14px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: 0.2s;
      box-sizing: border-box;
    }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }

    .cancel-btn {
      background: white;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 14px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: 0.2s;
      box-sizing: border-box;
    }
    .cancel-btn:hover { background: #f8fafc; border-color: #94a3b8; }
    .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }

    .error-banner {
      background: #fff5f5;
      color: #c53030;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      margin-top: 8px;
    }

    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .success-state {
      text-align: center;
    }
    .success-badge {
      width: 60px; height: 60px;
      background: #48bb78; color: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 30px;
      margin: 0 auto 16px;
    }
    .user-card {
      display: flex; align-items: center; gap: 16px;
      padding: 16px; background: #f7fafc; border-radius: 12px;
      margin: 20px 0; text-align: left;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow: hidden;
    }

    .user-info strong {
      font-size: 16px;
      color: #1a202c;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-info span {
      font-size: 14px;
      color: #718096;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .submit-btn.full-width {
      width: 100%;
      box-sizing: border-box;
    }

    .date-text {
      color: #718096;
      font-size: 14px;
      font-weight: 500;
    }

    .password-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .password-hash {
      color: #e53e3e;
      font-size: 12px;
      font-weight: 600;
      background: #fff5f5;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .icon-btn {
      background: none;
      border: none;
      color: #a0aec0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      color: #4a5568;
      background: #edf2f7;
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input-wrapper input {
      padding-right: 40px;
    }

    .eye-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #a0aec0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      transition: color 0.2s;
    }

    .eye-btn:hover {
      color: #2d3748;
    }

    .delete-btn {
      background: #fff5f5;
      color: #e53e3e;
      border: 1px solid #feb2b2;
      border-radius: 6px;
      padding: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .delete-btn:hover {
      background: #e53e3e;
      color: white;
      border-color: #e53e3e;
    }

    .success-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #48bb78;
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(72, 187, 120, 0.3);
      z-index: 10001;
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Tablet (1024px and below) */
    @media (max-width: 1024px) {
      .users-table-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .full-width-table {
        min-width: 700px;
      }
      .dashboard-content {
        padding: 0 20px;
      }
      .header-content {
        padding: 0 20px;
      }
    }

    /* Mobile (768px and below) */
    @media (max-width: 768px) {
      .dashboard-header {
        padding: 16px 0;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
        padding: 0 16px;
      }

      .title-area h2 {
        font-size: 22px;
      }

      /* Button: auto width, don't stretch */
      .create-btn {
        width: auto;
        align-self: flex-start;
        font-size: 14px;
        padding: 10px 16px;
      }

      .dashboard-content {
        margin: 20px auto;
        padding: 0 16px;
      }

      /* Switch table to card layout on mobile */
      .users-table-container {
        overflow-x: unset;
        background: transparent;
        box-shadow: none;
        border: none;
      }

      .full-width-table {
        min-width: unset;
      }

      /* Hide table header on mobile */
      .full-width-table tr.mat-header-row,
      .full-width-table mat-header-row {
        display: none;
      }

      /* Each row becomes a card */
      .full-width-table tr.mat-row,
      .full-width-table mat-row {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        background: white !important;
        border-radius: 14px;
        margin-bottom: 12px;
        padding: 14px 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        border: 1px solid #edf2f7;
        height: auto;
      }

      .full-width-table tr.mat-row:hover,
      .full-width-table mat-row:hover {
        background: #fff7ed !important;
      }

      /* Each cell: inline block */
      .full-width-table td.mat-cell,
      .full-width-table mat-cell {
        display: flex;
        align-items: center;
        border: none;
        padding: 2px 0;
        font-size: 14px;
      }

      /* Avatar cell — full row width */
      .full-width-table td[class*="avatar"],
      .full-width-table mat-cell[class*="avatar"] {
        flex: 0 0 auto;
      }

      /* Name cell */
      .full-width-table td[class*="name"],
      .full-width-table mat-cell[class*="name"] {
        flex: 1 1 auto;
        font-weight: 700;
        font-size: 15px;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Role badge — stays on first line */
      .full-width-table td[class*="role"],
      .full-width-table mat-cell[class*="role"] {
        flex: 0 0 auto;
      }

      /* Actions — push to far right */
      .full-width-table td[class*="actions"],
      .full-width-table mat-cell[class*="actions"] {
        flex: 0 0 auto;
        margin-left: auto;
      }

      /* Hide password and date on mobile to reduce noise */
      .full-width-table td[class*="password"],
      .full-width-table mat-cell[class*="password"],
      .full-width-table td[class*="created"],
      .full-width-table mat-cell[class*="created"] {
        display: none;
      }

      /* Email — second line, full width */
      .full-width-table td[class*="email"],
      .full-width-table mat-cell[class*="email"] {
        flex: 1 1 100%;
        padding-left: 48px;
        color: #718096;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .modal-content {
        border-radius: 20px 20px 0 0;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-width: 100%;
        width: 100%;
        max-height: 95vh;
        padding: 24px 20px;
        animation: slideUpSheet 0.3s ease-out;
      }

      @keyframes slideUpSheet {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      .success-toast {
        left: 16px;
        right: 16px;
        bottom: 16px;
        text-align: center;
      }
    }

    /* Small mobile (480px and below) */
    @media (max-width: 480px) {
      .title-area h2 { font-size: 20px; }
      .title-area p { font-size: 13px; }
    }
  `]
})
export class UsersComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  
  dataSource = new MatTableDataSource<any>([]); 
  displayedColumns: string[] = ['avatar', 'name', 'email', 'password', 'role', 'actions', 'createdAt'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  showModal = false;
  showRegPassword = false;
  newUser: any = { name: '', email: '', password: '', avatarUrl: '', role: 'user' };
  error = '';
  isSubmitting = false;
  isSuccess = false;
  registeredName = '';
  registeredEmail = '';
  registeredAvatarUrl = '';
  successMessage = '';

  showDeleteConfirm = false;
  userToDelete: { id: string, name: string } | null = null;
  isUploadingImage = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchUsers();
    }
  }

  getImageUrl(url: string | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}${url}`;
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const nameHint = this.newUser.name;
    if (file) {
      this.isUploadingImage = true;
      this.error = '';
      this.cdr.detectChanges();
      this.authService.uploadImage(file, nameHint).subscribe({
        next: (res) => {
          this.newUser.avatarUrl = res.imageUrl;
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

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  fetchUsers() {
    this.authService.getUsers().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load users', err);
      }
    });
  }

  deleteUser(id: string, name: string) {
    this.userToDelete = { id, name };
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    this.authService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.fetchUsers();
        this.showDeleteConfirm = false;
        this.userToDelete = null;
        this.successMessage = 'User successfully deleted.';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete user.');
        this.showDeleteConfirm = false;
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.userToDelete = null;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  openRegisterModal() {
    this.resetForm();
    this.showModal = true;
  }

  closeModal(event?: Event) {
    if (event && (event.target as HTMLElement).className !== 'modal-overlay') {
      return;
    }
    this.showModal = false;
    if (this.isSuccess) {
      this.fetchUsers();
    }
  }

  onSubmit() {
    this.isSubmitting = true;
    this.error = '';

    this.registeredName = this.newUser.name;
    this.registeredEmail = this.newUser.email;
    this.registeredAvatarUrl = this.newUser.avatarUrl;

    this.authService.adminRegister(this.newUser).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSuccess = true;
        this.fetchUsers();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.error = err?.error?.message || (err?.error?.errors && err.error.errors[0]?.msg) || 'Failed to register user.';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.newUser = { name: '', email: '', password: '', avatarUrl: '', role: 'user' };
    this.isSuccess = false;
    this.error = '';
    this.registeredName = '';
    this.registeredEmail = '';
    this.registeredAvatarUrl = '';
  }
}
