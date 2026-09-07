import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
      <!-- Left: Brand -->
      <div class="nav-brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <a routerLink="/dashboard" (click)="closeMobileMenu()">Savoria</a>
      </div>

      <ng-container *ngIf="authService.currentUser$ | async as user; else guestLinks">

        <!-- Center Menu -->
        <div class="nav-menu-center" [class.mobile-open]="isMobileMenuOpen">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Dashboard
          </a>
          <a routerLink="/recipes" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            Categories
          </a>
          <a *ngIf="user.role === 'admin'" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" routerLink="/admin/users" class="nav-link" (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Users
          </a>
          <a routerLink="/recipes/new" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Recipe
          </a>
        </div>

        <!-- Right: Profile + Hamburger -->
        <div class="nav-right">
          <div class="profile-dropdown">
            <button class="profile-btn">
              <div class="avatar">{{ getInitials(user.name) }}</div>
              <div class="profile-info">
                <span class="profile-name">{{ user.name }}</span>
                <span *ngIf="user.role === 'admin'" class="badge admin-badge">Admin</span>
              </div>
              <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            <div class="dropdown-menu">
              <div class="dropdown-header">
                <div class="avatar-lg">{{ getInitials(user.name) }}</div>
                <div>
                  <div class="dropdown-name">{{ user.name }}</div>
                  <div class="dropdown-email">{{ user.email }}</div>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <a routerLink="/recipes/my" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                My Recipes
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout-item" (click)="authService.logout()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout
              </button>
            </div>
          </div>

          <!-- Hamburger: shown only on mobile/tablet -->
          <button class="hamburger-btn" (click)="toggleMobileMenu()">
            <svg *ngIf="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            <svg *ngIf="isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

      </ng-container>

      <ng-template #guestLinks>
        <div class="nav-right">
          <a routerLink="/login" class="login-link">Sign In</a>
        </div>
      </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
      position: sticky;
      top: 0;
      z-index: 10;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #e67e22;
      flex: 1;
    }

    .nav-brand a {
      font-size: 22px;
      font-weight: 700;
      color: #e53e3e;
      text-decoration: none;
      letter-spacing: -0.5px;
    }

    .nav-menu-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex: 2;
    }

    .nav-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 1;
    }

    /* Standard Nav Links */
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #4a5568;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 8px 14px;
      border-radius: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .nav-link:hover {
      background-color: #f7fafc;
      color: #2d3748;
    }

    .nav-link.active {
      color: #f97316;
      background-color: #fff7ed;
    }

    /* Admin Link */
    .admin-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #f97316;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 8px 14px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .admin-link:hover {
      background-color: #fff7ed;
    }

    /* Profile Dropdown */
    .profile-dropdown {
      position: relative;
    }

    .profile-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: none;
      border: 2px solid transparent;
      padding: 6px 12px 6px 6px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .profile-btn:hover {
      background: #f7fafc;
      border-color: #e2e8f0;
    }

    .profile-dropdown:hover .profile-btn {
      background: #f7fafc;
      border-color: #e2e8f0;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }

    .profile-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .profile-name {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .admin-badge {
      background-color: #ef4444;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .chevron {
      color: #a0aec0;
      transition: transform 0.3s ease;
    }

    .profile-dropdown:hover .chevron {
      transform: rotate(180deg);
    }

    /* Responsive Navbar */
    @media (max-width: 600px) {
      .navbar {
        padding: 12px 16px;
      }
      .profile-btn {
        padding: 4px 8px 4px 4px;
        gap: 6px;
      }
      .profile-name {
        display: none;
      }
      .nav-brand a {
        font-size: 18px;
      }
      .add-text {
        display: none;
      }
    }

    /* Dropdown Menu */
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
      min-width: 240px;
      padding: 8px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s ease;
      z-index: 1001;
      border: 1px solid #f0f0f0;
    }

    .profile-dropdown:hover .dropdown-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
    }

    .avatar-lg {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 15px;
      flex-shrink: 0;
    }

    .dropdown-name {
      font-size: 15px;
      font-weight: 700;
      color: #1a202c;
    }

    .dropdown-email {
      font-size: 13px;
      color: #a0aec0;
      margin-top: 2px;
    }

    .dropdown-divider {
      height: 1px;
      background: #f0f0f0;
      margin: 4px 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #4a5568;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      background: none;
      border: none;
      width: 100%;
      box-sizing: border-box;
      text-align: left;
    }

    .dropdown-item:hover {
      background: #f7fafc;
      color: #2d3748;
    }

    .logout-item {
      color: #e53e3e;
    }

    .logout-item:hover {
      background: #fff5f5;
      color: #c53030;
    }

    /* Sign In Link */
    .login-link {
      background-color: #f97316;
      color: white;
      text-decoration: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .login-link:hover {
      background-color: #ea580c;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    }

    .hamburger-btn {
      display: none;
      background: none;
      border: none;
      color: #4a5568;
      cursor: pointer;
      padding: 8px;
    }

    /* Tablet tweaks: hide name/badge + chevron, keep avatar */
    @media (max-width: 1024px) {
      .profile-info {
        display: none;
      }
      .chevron {
        display: none;
      }
      .nav-link {
        padding: 8px 10px;
        font-size: 13px;
      }
    }

    /* Mobile: hamburger takeover */
    @media (max-width: 768px) {
      .hamburger-btn {
        display: block;
      }

      .navbar {
        padding: 12px 20px;
        position: relative;
      }

      /* Hide the entire profile dropdown on mobile — 
         profile info appears in the hamburger slide-down instead */
      .profile-dropdown {
        display: none;
      }

      .nav-container {
        padding: 12px 16px;
      }

      .nav-menu-center {
        display: none;
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        border-top: 2px solid #fff7ed;
        z-index: 999;
        gap: 4px;
      }

      .nav-menu-center.mobile-open {
        display: flex;
      }

      .nav-link {
        width: 100%;
        padding: 14px 16px;
        font-size: 15px;
        font-weight: 600;
        justify-content: flex-start;
        border-radius: 10px;
      }

      .nav-link:hover,
      .nav-link.active {
        background-color: #fff7ed;
        color: #f97316;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
