import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from "@angular/core";
import { isPlatformBrowser, CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../core/services/auth.service";
import { User } from "../core/models/types";
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner.component';
import { ConfirmationModalComponent } from '../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, ConfirmationModalComponent],
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
        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Role</th>
                <th class="actions-col">Actions</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of users">
                <td>
                  <div class="avatar-only">
                    <div class="avatar" *ngIf="!u.avatarUrl || u.avatarUrl === 'default-avatar.png'">{{ getInitials(u.name) }}</div>
                    <img class="avatar-img" *ngIf="u.avatarUrl && u.avatarUrl !== 'default-avatar.png'" [src]="u.avatarUrl" alt="Avatar">
                  </div>
                </td>
                <td>
                  <span class="user-name-text">{{ u.name }}</span>
                </td>
                <td>
                  <span class="user-email-text">{{ u.email }}</span>
                </td>
                <td>
                  <div class="password-cell">
                    <span class="password-mask">••••••••</span>
                  </div>
                </td>
                <td>
                  <span class="role-badge" [ngClass]="u.role">{{ u.role }}</span>
                </td>
                <td>
                  <button class="delete-btn" (click)="deleteUser(u._id, u.name)" title="Delete User">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
                <td>
                  <span class="date-text">{{ u.createdAt | date:'medium' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="success-toast" *ngIf="successMessage">
        {{ successMessage }}
      </div>

      <!-- Registration Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="closeModal()">&times;</button>
          
          <div class="modal-header">
            <h3>Register New User</h3>
            <p>Add a new member to the community</p>
          </div>

          <div *ngIf="!isSuccess; else successState">
            <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="modal-form">
              <div class="input-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" [(ngModel)]="newUser.name" name="name" required placeholder="John Doe">
              </div>

              <div class="input-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" [(ngModel)]="newUser.email" name="email" required placeholder="john@example.com">
              </div>

              <div class="input-group">
                <label for="avatarUrl">Avatar URL (Optional)</label>
                <input type="url" id="avatarUrl" [(ngModel)]="newUser.avatarUrl" name="avatarUrl" placeholder="https://example.com/avatar.jpg">
              </div>

              <div class="input-group">
                <label for="password">Password</label>
                <div class="password-input-wrapper">
                  <input [type]="showRegPassword ? 'text' : 'password'" id="password" [(ngModel)]="newUser.password" name="password" required minlength="6" placeholder="••••••••">
                  <button type="button" class="eye-btn" (click)="showRegPassword = !showRegPassword">
                    <svg *ngIf="!showRegPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg *ngIf="showRegPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
              </div>

              <div *ngIf="error" class="error-banner">
                {{ error }}
              </div>

              <button type="submit" class="submit-btn" [disabled]="!regForm.form.valid || isSubmitting">
                <span *ngIf="!isSubmitting">Register User</span>
                <app-loading-spinner *ngIf="isSubmitting"></app-loading-spinner>
              </button>
            </form>
          </div>

          <ng-template #successState>
            <div class="success-state">
              <div class="success-badge">✓</div>
              <h2>Registration Complete</h2>
              <p class="success-sub">The user has been successfully registered.</p>
              
              <div class="user-card">
                <div class="user-avatar">{{ getInitials(registeredName) }}</div>
                <div class="user-info">
                  <strong>{{ registeredName }}</strong>
                  <span>{{ registeredEmail }}</span>
                </div>
              </div>

              <button class="submit-btn full-width" (click)="resetForm()">Register Another</button>
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
      background-color: #f8f9fa;
      min-height: calc(100vh - 70px);
      font-family: 'Inter', 'Segoe UI', sans-serif;
      padding-bottom: 60px;
    }

    .dashboard-header {
      background: white;
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
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-area h2 {
      margin: 0 0 4px;
      font-size: 26px;
      font-weight: 800;
      color: #1a202c;
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
      max-width: 100%;
      margin: 40px auto;
      padding: 0 40px;
    }

    .users-table-container {
      background: white;
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
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s;
    }

    .modal-content {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 450px;
      padding: 40px;
      position: relative;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
      background: white;
    }

    .submit-btn {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
      display: flex;
      justify-content: center;
      transition: 0.2s;
    }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
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
      display: flex; align-items: center; gap: 12px;
      padding: 16px; background: #f7fafc; border-radius: 12px;
      margin: 20px 0; text-align: left;
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
  `]
})
export class UsersComponent implements OnInit {
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  
  users: any[] = []; 
  
  showModal = false;
  showRegPassword = false;
  newUser = { name: '', email: '', password: '', avatarUrl: '' };
  error = '';
  isSubmitting = false;
  isSuccess = false;
  registeredName = '';
  registeredEmail = '';
  successMessage = '';

  showDeleteConfirm = false;
  userToDelete: { id: string, name: string } | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchUsers();
    }
  }

  fetchUsers() {
    this.authService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
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

    this.authService.register(this.newUser).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSuccess = true;
        this.fetchUsers();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.error = err?.error?.message || 'Failed to register user.';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.newUser = { name: '', email: '', password: '', avatarUrl: '' };
    this.isSuccess = false;
    this.error = '';
    this.registeredName = '';
    this.registeredEmail = '';
  }
}
