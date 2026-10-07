import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { RelativeTimePipe } from '../shared/pipes/relative-time.pipe';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LoginPromptModalComponent } from '../shared/components/login-prompt-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RelativeTimePipe, MatDialogModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
      <!-- Left: Brand -->
      <div class="nav-brand">
        <a routerLink="/discover" (click)="closeMobileMenu()">
          <img src="assets/savoria-logo.png" alt="Savoria Logo" class="logo">
        </a>
      </div>

      <!-- Center Menu -->
      <div class="nav-menu-center" [class.mobile-open]="isMobileMenuOpen">
        <a routerLink="/discover" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" (click)="closeMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
          Discover
        </a>
        <a routerLink="/recipes" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" (click)="closeMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          Recipes
        </a>
        <a *ngIf="(currentUser$ | async)?.role === 'admin'" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" routerLink="/admin/users" class="nav-link" (click)="closeMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Users
        </a>
        <a class="nav-link" [class.active]="router.url === '/recipes/new'" (click)="onAddRecipeClick($event)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create Recipe
        </a>
        <a class="nav-link mobile-only-link" *ngIf="!(currentUser$ | async)" routerLink="/login" (click)="closeMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
          Sign In
        </a>
      </div>

      <ng-container *ngIf="currentUser$ | async as user; else guestLinks">

        <!-- Right: Profile + Hamburger -->
        <div class="nav-right">
          <!-- Notification Bell -->
          <div class="notification-dropdown" (click)="toggleNotifications($event)">
            <button class="notification-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span *ngIf="unreadCount$() > 0" class="notification-badge">
                {{ unreadCount$() > 99 ? '99+' : unreadCount$() }}
              </span>
            </button>
            
            <div class="notif-menu" [class.show]="isNotificationsOpen" (click)="$event.stopPropagation()">
              <div class="notif-header">
                <h3>Notifications</h3>
                <button *ngIf="unreadCount$() > 0" class="text-btn" (click)="markAllAsRead()">Mark all read</button>
              </div>
              <div class="notif-tabs">
                <button class="notif-tab" [class.active]="notifFilter === 'all'" (click)="setNotifFilter('all')">All</button>
                <button class="notif-tab" [class.active]="notifFilter === 'unread'" (click)="setNotifFilter('unread')">Unread</button>
              </div>
              <div class="notif-list">
                <div *ngIf="filteredNotifications().length === 0" class="empty-notif">
                  No notifications found
                </div>
                <div *ngFor="let notif of filteredNotifications()" 
                     class="notif-item" 
                     [class.unread]="!notif.read"
                     (click)="handleNotificationClick(notif)">
                  <img *ngIf="notif.senderAvatar" [src]="notif.senderAvatar" alt="Avatar" class="notif-avatar" />
                  <div *ngIf="!notif.senderAvatar" class="notif-avatar fallback">
                    {{ getInitials(notif.senderName) }}
                  </div>
                  <div class="notif-content">
                    <p class="notif-text">
                      <strong>{{ notif.senderName }}</strong>
                      <span *ngIf="notif.groupedCount && notif.groupedCount > 0"> and {{ notif.groupedCount }} others </span>
                      &nbsp;
                      <ng-container [ngSwitch]="notif.type">
                        <span *ngSwitchCase="'review'">reviewed your recipe</span>
                        <span *ngSwitchCase="'save'">saved your recipe</span>
                        <span *ngSwitchCase="'reply'">replied to your review on</span>
                        <span *ngSwitchCase="'helpful'">found your review helpful on</span>
                      </ng-container>&nbsp;
                      <strong>{{ notif.recipeTitle }}</strong>
                    </p>
                    <span class="notif-time">{{ notif.updatedAt || notif.createdAt | relativeTime }}</span>
                  </div>
                  <div class="notif-media" *ngIf="notif.recipeImage">
                    <img [src]="notif.recipeImage" alt="Recipe" />
                  </div>
                  <div class="notif-actions">
                    <button *ngIf="!notif.read" class="mark-read-btn" (click)="markAsRead(notif._id, $event)" title="Mark as read">
                      <span class="read-dot"></span>
                    </button>
                    <button class="delete-notif-btn" (click)="deleteNotification(notif._id, $event)" title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div *ngIf="hasMoreNotifications()" class="load-more-container">
                <button class="load-more-btn" (click)="loadMoreNotifications($event)" [disabled]="isLoadingNotifications()">
                  {{ isLoadingNotifications() ? 'Loading...' : 'Load More' }}
                </button>
              </div>
            </div>
          </div>

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
              <a routerLink="/collections" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                My Cookbooks
              </a>
               <a routerLink="/meal-planner" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Meal Planner
               </a>
              <a routerLink="/settings" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Settings
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout-item" (click)="logout()">
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
          
          <button class="hamburger-btn" (click)="toggleMobileMenu()">
            <svg *ngIf="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            <svg *ngIf="isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    @media print {
      .navbar { display: none !important; }
    }
    .navbar {
      background-color: rgba(250, 245, 235, 0.85); /* Premium warm cream with transparency */
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 4px 30px rgba(60, 34, 24, 0.05); /* Espresso tinted shadow */
      border-bottom: 1px solid rgba(214, 211, 209, 0.5); /* Warm stone border */
      position: sticky;
      top: 0;
      z-index: 1000;
      transition: background-color 0.3s ease;
    }

    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      max-width: 1280px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .nav-brand a {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      color: #ea580c; /* Terracotta */
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    
    .logo {
      width: auto;
      height: 40px;
      object-fit: contain;
      transform: scale(1.6); 
      transform-origin: left center;
    }

    .nav-menu-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex: 2;
    }

    /* Nav Right Gap */
    .nav-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 1;
      gap: 16px;
    }

    /* Notification Bell */
    .notification-dropdown {
      position: relative;
    }

    .notification-btn {
      background: none;
      border: none;
      color: #57534e;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s;
    }
    .notification-btn:hover {
      background: rgba(234, 88, 12, 0.08);
      color: #ea580c;
    }

    .notification-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 2px 5px;
      border-radius: 10px;
      line-height: 1;
      min-width: 14px;
      text-align: center;
    }

    .notif-menu {
      position: absolute;
      top: calc(100% + 12px);
      right: -20px;
      width: 320px;
      background: #faf5eb;
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(60, 34, 24, 0.12), 0 4px 12px rgba(60, 34, 24, 0.04);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      z-index: 1001;
      border: 1px solid rgba(214, 211, 209, 0.6);
      overflow: hidden;
    }
    
    .notif-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #ffffff;
      border-bottom: 1px solid rgba(214, 211, 209, 0.5);
    }

    .notif-tabs {
      display: flex;
      border-bottom: 1px solid rgba(214, 211, 209, 0.5);
      background: #ffffff;
      padding: 0 16px;
    }

    .notif-tab {
      background: none;
      border: none;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #78716c;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    .notif-tab.active {
      color: #ea580c;
      border-bottom-color: #ea580c;
    }

    .notif-header h3 {
      margin: 0;
      font-size: 15px;
      color: #3C2218;
    }

    .text-btn {
      background: none;
      border: none;
      color: #ea580c;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .text-btn:hover {
      text-decoration: underline;
    }

    .notif-list {
      max-height: 360px;
      overflow-y: auto;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
      border-bottom: 1px solid rgba(214, 211, 209, 0.5);
      transition: background-color 0.2s;
      cursor: pointer;
      position: relative;
    }

    .notif-item:hover {
      background: rgba(214, 211, 209, 0.1);
    }

    .notif-item.unread {
      background: rgba(234, 88, 12, 0.04);
    }

    .notif-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .notif-avatar.fallback {
      background: #ea580c;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-text {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #57534e;
      line-height: 1.4;
    }

    .notif-text strong {
      color: #292524;
    }

    .notif-time {
      font-size: 12px;
      color: #a8a29e;
    }

    .notif-media {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .notif-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .notif-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .mark-read-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .read-dot {
      width: 10px;
      height: 10px;
      background: #ea580c;
      border-radius: 50%;
    }

    .delete-notif-btn {
      background: none;
      border: none;
      color: #a8a29e;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }

    .notif-item:hover .delete-notif-btn {
      opacity: 1;
    }

    .delete-notif-btn:hover {
      background: #fecaca;
      color: #dc2626;
    }

    .load-more-container {
      padding: 12px;
      text-align: center;
      border-top: 1px solid rgba(214, 211, 209, 0.4);
    }

    .load-more-btn {
      background: none;
      border: 1px solid #ea580c;
      color: #ea580c;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 6px 16px;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .load-more-btn:hover:not([disabled]) {
      background: #ea580c;
      color: white;
    }

    .load-more-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: #a8a29e;
      color: #a8a29e;
    }

    .empty-notif {
      padding: 32px 16px;
      text-align: center;
      color: #78716c;
      font-size: 14px;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(214, 211, 209, 0.3);
      cursor: pointer;
      transition: background 0.2s;
    }
    .notif-item:hover {
      background: #ffffff;
    }
    .notif-item.unread {
      background: rgba(234, 88, 12, 0.04);
    }

    .notif-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    .notif-avatar.fallback {
      background: #3C2218;
      color: #faf5eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
    }

    .notif-content {
      flex: 1;
    }
    .notif-text {
      margin: 0 0 4px 0;
      font-size: 13px;
      color: #57534e;
      line-height: 1.4;
    }
    .notif-text strong {
      color: #3C2218;
    }
    .notif-time {
      font-size: 11px;
      color: #a8a29e;
    }

    .mark-read-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .read-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #ea580c;
      border-radius: 50%;
    }

    /* Standard Nav Links */
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #57534e; /* Warm stone text */
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 12px;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .nav-link:hover {
      background-color: rgba(234, 88, 12, 0.08); /* Terracotta tint */
      color: #3C2218; /* Espresso hover text */
    }

    .nav-link.active {
      color: #ea580c;
      background-color: #fff7ed;
      font-weight: 700;
    }

    /* Admin Link */
    .admin-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ea580c; /* Terracotta */
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .admin-link:hover {
      background-color: rgba(234, 88, 12, 0.08);
    }

    /* Profile Dropdown */
    .profile-dropdown {
      position: relative;
    }

    .profile-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid #d6d3d1; /* warm stone */
      padding: 6px 12px 6px 6px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .profile-btn:hover {
      background: #ffffff;
      border-color: #ea580c;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.1);
    }

    .profile-dropdown:hover .profile-btn {
      background: #ffffff;
      border-color: #ea580c;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 14px;
      background: #3C2218; /* Espresso Background */
      color: #faf5eb; /* Warm cream text */
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }

    .profile-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .profile-name {
      font-size: 14px;
      font-weight: 700;
      color: #3C2218; /* Espresso */
      max-width: 130px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .badge {
      font-size: 10px;
      font-weight: 800;
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
      top: calc(100% + 12px);
      right: 0;
      background: #faf5eb; /* Warm Cream */
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(60, 34, 24, 0.12), 0 4px 12px rgba(60, 34, 24, 0.04);
      min-width: 260px;
      padding: 12px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      z-index: 1001;
      border: 1px solid rgba(214, 211, 209, 0.6);
    }

    .profile-dropdown:hover .dropdown-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      background: #ffffff;
      border-radius: 12px;
      margin-bottom: 8px;
    }

    .avatar-lg {
      width: 44px;
      height: 44px;
      border-radius: 16px;
      background: #3C2218; /* Espresso */
      color: #faf5eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }

    .dropdown-name {
      font-size: 15px;
      font-weight: 700;
      color: #3C2218;
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dropdown-email {
      font-size: 12px;
      color: #78716c;
      margin-top: 2px;
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dropdown-divider {
      height: 1px;
      background: rgba(214, 211, 209, 0.5);
      margin: 8px 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: #57534e;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      background: none;
      border: none;
      width: 100%;
      box-sizing: border-box;
      text-align: left;
    }

    .dropdown-item:hover {
      background: rgba(234, 88, 12, 0.08);
      color: #ea580c;
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
    
    .mobile-only-link {
      display: none;
    }

    /* Mobile: hamburger takeover */
    @media (max-width: 768px) {
      .login-link {
        display: none;
      }
      .mobile-only-link {
        display: flex;
      }
      .hamburger-btn {
        display: block;
      }

      /* Fix notification dropdown cutoff on small screens */
      .notif-menu {
        position: fixed;
        top: 70px;
        right: 16px;
        left: 16px;
        width: auto;
        max-width: 400px;
        margin: 0 auto;
        transform: translateY(-10px);
      }
      .notif-menu.show {
        transform: translateY(0);
      }

      .navbar {
        padding: 12px 20px;
        position: relative;
      }

      .nav-container {
        padding: 12px 16px;
      }

      .nav-menu-center {
        display: none;
        position: absolute;
        top: 100%;
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
        color: #ea580c;
      }
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  public router = inject(Router);
  private dialog = inject(MatDialog);

  onAddRecipeClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.closeMobileMenu();
    if (!this.authService.currentUserValue) {
      this.dialog.open(LoginPromptModalComponent, {
        width: '400px',
        autoFocus: false
      });
    } else {
      this.router.navigate(['/recipes/new']);
    }
  }

  readonly currentUser$ = this.authService.currentUser$;
  readonly notifications$ = this.notifService.notifications;
  readonly unreadCount$ = this.notifService.unreadCount;
  readonly hasMoreNotifications = this.notifService.hasMore;
  readonly isLoadingNotifications = this.notifService.isLoading;

  isMobileMenuOpen = false;
  isNotificationsOpen = false;
  notifFilter: 'all' | 'unread' = 'all';

  filteredNotifications() {
    const notifs = this.notifications$();
    if (this.notifFilter === 'unread') {
      return notifs.filter(n => !n.read);
    }
    return notifs;
  }

  setNotifFilter(filter: 'all' | 'unread') {
    this.notifFilter = filter;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isNotificationsOpen = false;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  handleNotificationClick(notif: any) {
    if (!notif.read) {
      this.notifService.markAsRead(notif._id);
    }
    this.isNotificationsOpen = false;
    this.router.navigate(['/recipes/id', notif.recipeId]);
  }

  markAsRead(id: string, event: Event) {
    event.stopPropagation();
    this.notifService.markAsRead(id);
  }

  deleteNotification(id: string, event: Event) {
    event.stopPropagation();
    this.notifService.deleteNotification(id);
  }

  markAllAsRead() {
    this.notifService.markAllAsRead();
  }

  loadMoreNotifications(event: Event) {
    event.stopPropagation();
    this.notifService.loadMore();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.closeMobileMenu();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}

