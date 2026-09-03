import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-wrapper">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-text">
          <h2>Welcome to Savoria</h2>
          <p>Your culinary command center. Track daily trends and fresh recipes.</p>
        </div>
      </div>

      <div class="dashboard-content">
        
        <div class="section-header">
          <div class="section-icon pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-5-5-10-5-10Z"></path><path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"></path></svg>
          </div>
          <h3>Recipes Added Today</h3>
          <span class="section-badge">Live Updates</span>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card" *ngFor="let cat of categoryKeys; let i = index" [style.animation-delay]="i * 0.1 + 's'">
            <div class="stat-icon-bg">
              <svg *ngIf="cat === 'Breakfast'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" y1="8" x2="12" y2="8"></line><line x1="3.95" y1="6.06" x2="8.54" y2="14"></line><line x1="10.88" y1="21.94" x2="15.46" y2="14"></line></svg>
              <svg *ngIf="cat === 'Lunch' || cat === 'Dinner'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
              <svg *ngIf="cat === 'Beverage'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M8 22h8"></path><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path></svg>
              <svg *ngIf="cat === 'Dessert' || cat === 'Snack'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.todayByCategory[cat] || 0 }}</div>
              <div class="stat-label">{{ cat }}</div>
            </div>
            <div class="trend-indicator up">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              Added Today
            </div>
          </div>
          
          <!-- Empty State -->
          <div class="stat-card empty fade-in" *ngIf="categoryKeys.length === 0">
            <div class="stat-icon-bg">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
            </div>
            <div class="stat-content">
              <div class="stat-value" style="color: #a0aec0;">0</div>
              <div class="stat-label" style="color: #a0aec0;">Recipes Added Today</div>
            </div>
            <p class="empty-hint">Be the first to share a recipe today!</p>
          </div>
        </div>

        <div class="section-header" style="margin-top: 60px;">
          <div class="section-icon star">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <h3>Fresh Out The Oven</h3>
          <span class="section-badge accent">Latest</span>
        </div>

        <div class="latest-recipe-wrapper fade-in" *ngIf="stats?.latestRecipe">
          <div class="latest-recipe-card">
            <div class="recipe-image-container">
              <div class="recipe-image" [style.background-image]="'url(' + (stats.latestRecipe.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80') + ')'"></div>
              <div class="category-pill">{{ stats.latestRecipe.category }}</div>
            </div>
            <div class="recipe-info">
              <h4 class="recipe-title">{{ stats.latestRecipe.title }}</h4>
              <p class="recipe-desc">{{ stats.latestRecipe.description || 'A delicious new recipe just added to Savoria.' }}</p>
              
              <div class="recipe-metrics">
                <div class="metric">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {{ stats.latestRecipe.cookingTime }} mins
                </div>
                <div class="metric">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  {{ stats.latestRecipe.difficulty }}
                </div>
              </div>

              <div class="meta">
                <div class="author-info">
                  <img *ngIf="stats.latestRecipe.owner?.avatarUrl && stats.latestRecipe.owner?.avatarUrl !== 'default-avatar.png'" [src]="stats.latestRecipe.owner?.avatarUrl" class="author-avatar" alt="Avatar">
                  <div *ngIf="!stats.latestRecipe.owner?.avatarUrl || stats.latestRecipe.owner?.avatarUrl === 'default-avatar.png'" class="author-avatar default">{{ stats.latestRecipe.owner?.name?.charAt(0) || 'U' }}</div>
                  <span class="author">By {{ stats.latestRecipe.owner?.name || 'Unknown' }}</span>
                </div>
                <a [routerLink]="['/recipes']" class="view-btn">Browse All Recipes</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="latest-recipe-card empty fade-in" *ngIf="!stats?.latestRecipe">
          <div class="empty-state-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <p>No recipes have been added yet to the platform.</p>
            <a routerLink="/recipes/new" class="create-btn">Create the first one</a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      background-color: #faf5eb; /* Richer Warm Cream */
      min-height: calc(100vh - 70px);
      font-family: 'Inter', 'Segoe UI', sans-serif;
      padding-bottom: 80px;
    }

    .page-header {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px 10px 20px;
    }

    .header-text h2 {
      margin: 0;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: -1px;
      color: #1a202c; /* Charcoal Text */
    }

    .header-text p {
      margin: 8px 0 0;
      font-size: 18px;
      font-weight: 500;
      color: #4a5568; /* Slightly lighter charcoal */
      max-width: 600px;
    }

    .dashboard-content {
      max-width: 1200px;
      margin: 20px auto 0;
      padding: 0 20px;
      position: relative;
      z-index: 10;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 24px 0;
    }

    .section-icon {
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: white;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .section-icon.pulse { animation: pulse 2s infinite; }

    .section-header h3 {
      font-size: 26px;
      color: #2d3748; /* Charcoal Gray Text */
      margin: 0;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .section-badge {
      background: #f97316; /* 10% Accent Orange */
      color: white;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
    }
    
    .section-badge.accent {
      background: #0f766e;
      box-shadow: 0 4px 6px rgba(15, 118, 110, 0.3);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.04);
      border: 1px solid rgba(226, 232, 240, 0.8);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    .stat-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 40px rgba(15, 118, 110, 0.1);
      border-color: #0f766e;
    }

    .stat-icon-bg {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 130px;
      height: 130px;
      background: linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0d9488;
      opacity: 0.6;
      transition: transform 0.4s ease;
    }
    
    .stat-card:hover .stat-icon-bg {
      transform: scale(1.15) rotate(-10deg);
    }

    .stat-content {
      position: relative;
      z-index: 2;
    }

    .stat-value {
      font-size: 64px;
      font-weight: 800;
      color: #f97316;
      line-height: 1;
      margin-bottom: 8px;
      letter-spacing: -3px;
    }

    .stat-label {
      font-size: 16px;
      font-weight: 700;
      color: #2d3748;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .empty-hint {
      margin-top: 20px;
      font-size: 14px;
      color: #718096;
      font-weight: 500;
    }

    .trend-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 24px;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      width: fit-content;
      position: relative;
      z-index: 2;
    }
    
    .trend-indicator.up {
      background: #fffaf0;
      color: #dd6b20;
    }

    .latest-recipe-wrapper {
      animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
    }

    .latest-recipe-card {
      background: white;
      border-radius: 30px;
      overflow: hidden;
      display: flex;
      box-shadow: 0 20px 40px rgba(0,0,0,0.06);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .latest-recipe-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 25px 50px rgba(0,0,0,0.1);
    }

    .latest-recipe-card.empty {
      padding: 60px;
      justify-content: center;
    }

    .empty-state-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .empty-state-content p {
      color: #718096;
      font-size: 18px;
      margin: 0;
    }

    .create-btn {
      background: #f97316;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .create-btn:hover { background: #ea580c; }

    .recipe-image-container {
      flex: 0 0 45%;
      position: relative;
      overflow: hidden;
    }

    .recipe-image {
      width: 100%;
      height: 100%;
      min-height: 380px;
      background-size: cover;
      background-position: center;
      transition: transform 0.8s ease;
    }
    
    .latest-recipe-card:hover .recipe-image {
      transform: scale(1.08);
    }
    
    .category-pill {
      position: absolute;
      top: 24px;
      left: 24px;
      background: rgba(255,255,255,0.95);
      color: #0f766e;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      backdrop-filter: blur(4px);
    }

    .recipe-info {
      padding: 40px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: white;
    }

    .recipe-title {
      font-size: 32px;
      font-weight: 800;
      color: #2d3748;
      margin: 0 0 16px 0;
      letter-spacing: -1px;
      line-height: 1.2;
    }

    .recipe-desc {
      color: #4a5568;
      font-size: 17px;
      line-height: 1.6;
      margin: 0 0 32px 0;
      font-weight: 400;
    }
    
    .recipe-metrics {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    
    .metric {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fdfbf7;
      padding: 10px 18px;
      border-radius: 12px;
      font-weight: 600;
      color: #4a5568;
      font-size: 15px;
      border: 1px solid #edf2f7;
    }
    
    .metric svg {
      color: #f97316;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 2px dashed #e2e8f0;
      margin-top: auto;
    }
    
    .author-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .author-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    
    .author-avatar.default {
      background: #0f766e;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
    }

    .author {
      color: #2d3748;
      font-weight: 700;
      font-size: 16px;
    }
    
    .view-btn {
      background: #2d3748;
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 14px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    
    .view-btn:hover {
      background: #0f766e;
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(15, 118, 110, 0.3);
    }

    /* Animations */
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    @keyframes float {
      0% { transform: translateY(0) rotate(15deg); }
      50% { transform: translateY(-15px) rotate(18deg); }
      100% { transform: translateY(0) rotate(15deg); }
    }
    
    .fade-in {
      animation: slideUp 0.6s ease forwards;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .latest-recipe-card {
        flex-direction: column;
      }
      .recipe-image-container {
        flex: none;
      }
      .recipe-image {
        min-height: 250px;
      }
      .recipe-title {
        font-size: 26px;
      }
      .meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
      }
      .view-btn {
        width: 100%;
        text-align: center;
      }
    }
    
    @media (max-width: 768px) {
      .header-text h2 {
        font-size: 32px;
      }
      .page-header {
        padding: 30px 20px 10px;
      }
      .dashboard-content {
        margin-top: 10px;
      }
      .stat-value {
        font-size: 48px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);
  
  stats: any = { todayByCategory: {}, latestRecipe: null };
  categoryKeys: string[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get<any>(`${this.apiUrl}/dashboard/stats`).subscribe({
        next: (data) => {
          this.stats = data;
          this.categoryKeys = Object.keys(data.todayByCategory || {});
        },
        error: (err) => console.error('Failed to load dashboard stats', err)
      });
    }
  }
}
