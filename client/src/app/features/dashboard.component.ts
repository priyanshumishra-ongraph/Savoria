import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecipeCardComponent } from '../shared/components/recipe-card.component';
import { NewsletterService } from '../core/services/newsletter.service';

@Component({  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, RecipeCardComponent],
  template: `
    <div class="dashboard-wrapper">
      <!-- Premium Hero Section -->
      <div class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="hero-badge">Curated Recipes</span>
          <h2 class="playfair">Welcome to Savoria</h2>
          <p>Your culinary command center. Discover daily trends, seasonal ingredients, and fresh recipes tailored for your kitchen.</p>
        </div>
      </div>

      <!-- How It Works Section -->
      <div class="dashboard-content features-section">
        <div class="feature-item">
          <div class="feature-icon-wrapper"><mat-icon>search</mat-icon></div>
          <h4>Discover</h4>
          <p>Explore hundreds of community-curated recipes filtered by category, difficulty, or diet.</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon-wrapper"><mat-icon>restaurant</mat-icon></div>
          <h4>Cook</h4>
          <p>Follow along with interactive cooking modes, step-by-step instructions, and timed phases.</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon-wrapper"><mat-icon>favorite_border</mat-icon></div>
          <h4>Share</h4>
          <p>Upload your own culinary masterpieces, save favorites, and inspire home chefs everywhere.</p>
        </div>
      </div>

      <!-- Loading State -->
      <div class="dashboard-content" *ngIf="isLoading" style="margin-top: 40px; text-align: center; color: #718096; min-height: 200px;">
        <mat-spinner diameter="40" style="margin: 0 auto 16px;"></mat-spinner>
        <p>Loading your dashboard...</p>
      </div>

      <!-- Error State -->
      <div class="dashboard-content" *ngIf="error && !isLoading" style="margin-top: 40px;">
        <div style="display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: #fee2e2; color: #dc2626; border-radius: 10px; font-weight: 500;">
          <mat-icon>error_outline</mat-icon>
          {{ error }}
        </div>
      </div>

      <!-- Categories Section -->
      <div class="dashboard-content" *ngIf="!isLoading && !error" style="margin-top: 40px;">
        <div class="section-header">
          <div class="section-icon category-icon">
            <mat-icon style="color: #0c831f;">category</mat-icon>
          </div>
          <h3>Browse By Category</h3>
          <a routerLink="/recipes" class="section-badge" style="background: #0c831f; text-decoration: none; cursor: pointer;">Explore 
            <mat-icon style="color: white; font-size: 16px; width: 16px; align-items: center; justify-content: center; height: 16px;">arrow_forward</mat-icon>
          </a>
        </div>

        <div class="categories-grid fade-in">
          <div class="category-card" *ngFor="let cat of categoryKeys; let i = index" 
               [routerLink]="['/recipes']" [queryParams]="{category: cat}"
               [style.animation-delay]="(i * 0.1) + 's'">
            <div class="cat-icon-wrapper">
              <mat-icon>{{ getCategoryIconName(cat) }}</mat-icon>
            </div>
            <h4>{{ cat }}</h4>
          </div>
        </div>
      </div>

      <div class="dashboard-content" *ngIf="!isLoading && !error" style="margin-top: 60px;">
        <!-- Fresh Out The Oven -->
        <div class="section-header">
          <div class="section-icon star">
            <mat-icon style="color: #f97316;">star</mat-icon>
          </div>
          <h3>Fresh Out The Oven</h3>
         
        </div>

        <div class="latest-recipe-wrapper fade-in" *ngIf="stats?.latestRecipe">
          <div class="latest-recipe-card" style="padding: 0;">
            <!-- Info on LEFT -->
            <div class="recipe-info">
              <div class="recipe-header-row">
                <div class="recipe-titles">
                  <h4 class="recipe-title">{{ stats.latestRecipe.title }}</h4>
                  <p class="recipe-desc">{{ stats.latestRecipe.description || 'A delicious new recipe just added to Savoria.' }}</p>
                </div>
                
                <div class="recipe-metrics">
                  <div class="metric" *ngIf="stats.latestRecipe.prepTimeMinutes || stats.latestRecipe.cookTimeMinutes">
                    <mat-icon style="color: #f97316; font-size: 18px; width: 18px; height: 18px;">schedule</mat-icon>
                    {{ (stats.latestRecipe.prepTimeMinutes || 0) + (stats.latestRecipe.cookTimeMinutes || 0) }} mins
                  </div>
                  <div class="metric">
                    <mat-icon style="color: #f97316; font-size: 18px; width: 18px; height: 18px;">trending_up</mat-icon>
                    {{ stats.latestRecipe.difficulty }}
                  </div>
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

            <!-- Image on RIGHT -->
            <div class="recipe-image-container">
              <div class="recipe-image" [style.background-image]="'url(' + (getImageUrl(stats.latestRecipe.imageUrl) && stats.latestRecipe.imageUrl !== 'placeholder-recipe.jpg' ? getImageUrl(stats.latestRecipe.imageUrl) : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80') + ')'"></div>
              <div class="category-pill">{{ stats.latestRecipe.category }}</div>
            </div>
          </div>
        </div>
        
        <mat-card class="latest-recipe-card empty fade-in" *ngIf="!stats?.latestRecipe">
          <div class="empty-state-content">
            <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #a0aec0;">menu_book</mat-icon>
            <p>No recipes have been added yet to the platform.</p>
            <a routerLink="/recipes/new" mat-flat-button color="accent" class="create-btn">Create the first one</a>
          </div>
        </mat-card>

      </div>

      <!-- Quick & Easy Section -->
      <div class="dashboard-content" *ngIf="!isLoading && !error && stats?.quickAndEasy?.length > 0" style="margin-top: 60px;">
        <div class="section-header">
          <div class="section-icon">
            <mat-icon style="color: #0c831f;">bolt</mat-icon>
          </div>
          <h3>Quick & Easy <span style="font-size: 14px; font-weight: normal; color: #718096; margin-left: 8px;">Ready in 30 mins or less</span></h3>
        </div>
        <div class="card-grid">
          <app-recipe-card *ngFor="let recipe of stats.quickAndEasy" [recipe]="recipe"></app-recipe-card>
        </div>
      </div>

      <!-- Trending Now Section -->
      <div class="dashboard-content" *ngIf="!isLoading && !error && stats?.recentRecipes?.length > 0" style="margin-top: 60px;">
        <div class="section-header">
          <div class="section-icon">
            <mat-icon style="color: #eab308;">local_fire_department</mat-icon>
          </div>
          <h3>Trending Now</h3>
        </div>
        <div class="card-grid">
          <app-recipe-card *ngFor="let recipe of stats.recentRecipes" [recipe]="recipe"></app-recipe-card>
        </div>
      </div>

      <div class="dashboard-content" *ngIf="!isLoading && !error" style="margin-top: 60px;">
        
        <!-- Recipes Added Today -->
        <div class="section-header">
          <div class="section-icon pulse">
            <mat-icon style="color: #f97316;">update</mat-icon>
          </div>
          <h3>Recipes Added Today</h3>
        </div>
        
        <div class="stats-grid">
          <!-- Total Recipes Card -->
          <mat-card class="stat-card" style="animation-delay: 0s;">
            <div class="stat-icon-bg">
              <mat-icon style="width: 40px; height: 40px; font-size: 40px;">menu_book</mat-icon>
            </div>
            <mat-card-content class="stat-content" style="padding: 0;">
              <div class="stat-value">{{ stats.totalRecipes || 0 }}</div>
              <div class="stat-label">Total Recipes</div>
            </mat-card-content>
            <div class="trend-indicator up">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">public</mat-icon>
              All Time
            </div>
          </mat-card>

          <mat-card class="stat-card" *ngFor="let cat of categoryKeys; let i = index" [style.animation-delay]="(i + 1) * 0.1 + 's'">
            <div class="stat-icon-bg">
              <mat-icon style="width: 40px; height: 40px; font-size: 40px;">{{ getCategoryIconName(cat) }}</mat-icon>
            </div>
            <mat-card-content class="stat-content" style="padding: 0;">
              <div class="stat-value">{{ stats.todayByCategory[cat] || 0 }}</div>
              <div class="stat-label">{{ cat }}</div>
            </mat-card-content>
            <div class="trend-indicator up">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">trending_up</mat-icon>
              Added Today
            </div>
          </mat-card>
          
          <!-- Empty State -->
          <mat-card class="stat-card empty fade-in" *ngIf="categoryKeys.length === 0">
            <div class="stat-icon-bg">
              <mat-icon style="width: 40px; height: 40px; font-size: 40px;">assignment</mat-icon>
            </div>
            <mat-card-content class="stat-content" style="padding: 0;">
              <div class="stat-value" style="color: #a0aec0;">0</div>
              <div class="stat-label" style="color: #a0aec0;">Recipes Added Today</div>
            </mat-card-content>
            <p class="empty-hint">Be the first to share a recipe today!</p>
          </mat-card>
        </div>

      </div>

      <!-- Newsletter Section -->
      <div class="newsletter-section">
        <div class="newsletter-content">
          <h3 class="playfair">Join the Savoria Weekly Digest</h3>
          <p>Get the most trending recipes, seasonal cooking tips, and chef interviews delivered straight to your inbox every Sunday morning.</p>
          <div class="newsletter-form">
            <input type="email" [formControl]="newsletterControl" placeholder="Enter your email address" class="newsletter-input" (keyup.enter)="subscribeToNewsletter()">
            <button class="newsletter-btn" (click)="subscribeToNewsletter()" [disabled]="isSubscribing">
              <span *ngIf="!isSubscribing">Subscribe</span>
              <mat-spinner *ngIf="isSubscribing" diameter="20" style="margin: 0 auto;"></mat-spinner>
            </button>
          </div>
          <div *ngIf="newsletterControl.invalid && newsletterControl.touched" class="newsletter-message error">
            Please enter a valid email address.
          </div>
          <div *ngIf="newsletterMessage" class="newsletter-message" [ngClass]="{'error': newsletterError}">
            {{ newsletterMessage }}
          </div>
        </div>
      </div>

      <!-- Community CTA Section -->
      <div class="community-cta">
        <h2 class="playfair">Ready to inspire others?</h2>
        <p>Join thousands of home chefs sharing their culinary masterpieces on Savoria.</p>
        <div class="cta-buttons">
          <a routerLink="/recipes/new" class="cta-btn primary">Share a Recipe</a>
          <a routerLink="/recipes" class="cta-btn secondary">Explore Kitchens</a>
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

    .hero-section {
      position: relative;
      height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      background-image: url('https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1600&q=80');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
    }

    .hero-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(to bottom, rgba(28, 25, 23, 0.4), rgba(28, 25, 23, 0.7));
    }

    .hero-content {
      position: relative;
      z-index: 2;
      color: white;
      max-width: 800px;
      padding: 0 20px;
    }

    .hero-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(4px);
      padding: 6px 14px;
      border-radius: 30px;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .hero-content h2 {
      font-size: 56px;
      margin: 0 0 16px;
      line-height: 1.1;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }

    .hero-content p {
      font-size: 19px;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 auto;
      line-height: 1.5;
      text-shadow: 0 1px 4px rgba(0,0,0,0.2);
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
      font-size: 22px;
      color:  #3C2218;
      margin: 0;
      font-weight: 800;
      letter-spacing: -0.5px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .section-badge {
      background: #f97316;
      color: white;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 16px;
      border-radius: 10px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      line-height: 1;
    }
    
    .section-badge mat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .section-badge.accent {
      background: #f97316;
      box-shadow: 0 4px 6px rgba(15, 118, 110, 0.3);
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
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
      border-color: #f97316;
    }

    .stat-icon-bg {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 130px;
      height: 130px;
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ea580c;
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
      color:  #3C2218;
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
      border-radius: 24px;
      overflow: hidden;
      display: flex;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      border: 1px solid #edf2f7;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      min-height: 350px;
    }
    
    .latest-recipe-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.12);
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
      flex: 0 0 40%;
      position: relative;
      overflow: hidden;
    }

    .recipe-image {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
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
      color: #f97316;
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
      padding: 40px 50px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: white;
    }

    .recipe-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 24px;
    }

    .recipe-titles {
      flex: 1;
    }

    .recipe-title {
      font-size: 32px;
      font-weight: 800;
      color:  #3C2218;
      margin: 0 0 12px 0;
      letter-spacing: -1px;
      line-height: 1.2;
    }

    .recipe-desc {
      color: #4a5568;
      font-size: 17px;
      line-height: 1.6;
      margin: 0;
      font-weight: 400;
    }
    
    .recipe-metrics {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: flex-end;
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
      background: #f97316;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
    }

    .author {
      color:  #3C2218;
      font-weight: 700;
      font-size: 16px;
    }
    
    .view-btn {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
      width: fit-content;
      display: inline-flex;
      align-items: center;
    }
    
    .view-btn:hover {
      background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(234, 88, 12, 0.35);
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

    /* Categories Section Styles */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .category-card {
      background: white;
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    .category-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(12, 131, 31, 0.1);
      border-color: #0c831f;
    }

    .cat-icon-wrapper {
      width: 64px;
      height: 64px;
      background: #f3fbf4;
      color: #0c831f;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }

    .cat-icon-wrapper mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .category-card:hover .cat-icon-wrapper {
      transform: scale(1.1);
      background: #0c831f;
      color: white;
    }

    .category-card h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color:  #3C2218;
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
      .recipe-metrics {
        flex-direction: row;
        flex-wrap: nowrap;
        gap: 12px;
        justify-content: flex-start;
      }
      .metric {
        flex: none;
        justify-content: flex-start;
        font-size: 14px;
        padding: 8px 16px;
        white-space: nowrap;
      }
      .meta {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .view-btn {
        width: auto;
        padding: 12px 16px;
        font-size: 14px;
        box-sizing: border-box;
        text-align: center;
        justify-content: center;
      }
    }
    
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 0 16px 40px;
      }
      .header-text h2 {
        font-size: 28px;
      }
      .page-header {
        padding: 20px 10px 10px;
      }
      .dashboard-content {
        margin-top: 10px;
      }
      .stat-value {
        font-size: 40px;
      }
      .author {
        display: none;
      }
      .section-header {
        flex-wrap: wrap;
        gap: 12px;
      }
      .section-header h3 {
        font-size: 20px;
      }
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .categories-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .category-card {
        padding: 16px 12px;
      }
    }

    /* Stack recipe card for tablets and mobile */
    @media (max-width: 1024px) {
      .latest-recipe-card {
        flex-direction: column !important;
      }
      .recipe-image-container {
        order: 1;
        width: 100%;
        height: 280px;
        flex: none;
      }
      .recipe-info {
        order: 2;
        padding: 30px !important;
      }
    }
    
    /* Ensure image container stretches fully on desktop */
    @media (min-width: 1025px) {
      .recipe-image-container {
        min-height: 100%;
        align-self: stretch;
      }
    }
    
    /* Features Section */
    .features-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      margin-top: -40px;
      margin-bottom: 40px;
    }
    .feature-item {
      background: white;
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.03);
      border: 1px solid #d6d3d1; /* Warm stone border */
      transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
    }
    .feature-item:hover {
      border-color: #ea580c; /* Terracotta border on hover */
      box-shadow: 0 12px 30px rgba(60, 34, 24, 0.08); /* Espresso shadow on hover */
      transform: translateY(-5px);
    }
    .feature-icon-wrapper {
      width: 60px;
      height: 60px;
      background: #fff7ed;
      color: #ea580c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .feature-icon-wrapper mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .feature-item h4 {
      font-size: 20px;
      font-weight: 700;
      color: #1c1917;
      margin: 0 0 10px 0;
    }
    .feature-item p {
      color: #78716c;
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
    }

    /* Newsletter Section */
    .newsletter-section {
      max-width: 1200px;
      margin: 80px auto;
      padding: 0 20px;
    }
    .newsletter-content {
      background: #3C2218; /* Rich Espresso Brown */
      border-radius: 24px;
      padding: 60px 40px;
      text-align: center;
      color: #faf5eb; /* Warm Cream text */
      box-shadow: 0 20px 40px rgba(60, 34, 24, 0.15);
    }
    .newsletter-content h3 {
      font-size: 36px;
      margin: 0 0 16px 0;
      color: #ffffff;
      line-height: 1.3;
    }
    .newsletter-content p {
      color: rgba(250, 245, 235, 0.85);
      font-size: 17px;
      max-width: 600px;
      margin: 0 auto 30px;
      line-height: 1.6;
    }
    .newsletter-form {
      display: flex;
      gap: 12px;
      max-width: 500px;
      margin: 0 auto;
    }
    .newsletter-input {
      flex: 1;
      padding: 16px 20px;
      border-radius: 12px;
      border: 2px solid transparent;
      font-size: 16px;
      outline: none;
      transition: border-color 0.2s;
    }
    .newsletter-input:focus {
      border-color: #ea580c;
    }
    .newsletter-btn {
      background: #ea580c; /* Terracotta Orange */
      color: white;
      border: none;
      padding: 0 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
    }
    .newsletter-btn:hover:not([disabled]) { 
      background: #c2410c; 
      transform: translateY(-2px);
    }
    .newsletter-btn[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .newsletter-message {
      margin-top: 16px;
      font-size: 14px;
      color: #48bb78;
      font-weight: 500;
      animation: fadeIn 0.3s;
    }
    .newsletter-message.error {
      color: #f56565;
    }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Community CTA Section */
    .community-cta {
      text-align: center;
      padding: 80px 20px 40px;
    }
    .community-cta h2 {
      font-size: 44px;
      color: #3C2218;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .community-cta p {
      color: #57534e;
      font-size: 19px;
      margin: 0 0 40px 0;
    }
    .cta-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
    }
    .cta-btn {
      padding: 16px 36px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 16px;
      text-decoration: none;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .cta-btn.primary {
      background: #ea580c; /* Terracotta Orange */
      color: white;
      box-shadow: 0 8px 20px rgba(234, 88, 12, 0.25);
    }
    .cta-btn.primary:hover { 
      background: #c2410c; 
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(234, 88, 12, 0.3);
    }
    .cta-btn.secondary {
      background: transparent;
      color: #3C2218;
      border: 2px solid #3C2218;
    }
    .cta-btn.secondary:hover { 
      background: #3C2218; 
      color: white;
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(60, 34, 24, 0.15);
    }

    @media (max-width: 600px) {
      .newsletter-form { flex-direction: column; }
      .newsletter-btn { padding: 16px; }
      .cta-buttons { flex-direction: column; }
      .community-cta h2 { font-size: 36px; }
      .newsletter-content h3 { font-size: 32px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  
  stats: any = { todayByCategory: {}, latestRecipe: null, totalRecipes: 0 };
  categoryKeys: string[] = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Beverage', 'Snack'];
  isLoading = true;
  error: string | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get<any>(`${this.apiUrl}/dashboard/stats`).subscribe({
        next: (data) => {
          this.stats = data;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to load dashboard data. Please try again.';
          this.isLoading = false;
          console.error('Failed to load dashboard stats', err);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  getImageUrl(url: string | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}${url}`;
  }

  getCategoryIconName(cat: string): string {
    const icons: Record<string, string> = {
      'Breakfast': 'bakery_dining',
      'Lunch': 'lunch_dining',
      'Dinner': 'dinner_dining',
      'Dessert': 'cake',
      'Beverage': 'local_cafe',
      'Snack': 'tapas'
    };
    return icons[cat] || 'restaurant';
  }

  // Newsletter Logic
  newsletterControl = new FormControl('', [Validators.required, Validators.email]);
  isSubscribing = false;
  newsletterMessage = '';
  newsletterError = false;
  private newsletterService = inject(NewsletterService);

  subscribeToNewsletter() {
    if (this.newsletterControl.invalid) {
      this.newsletterControl.markAsTouched();
      return;
    }

    this.isSubscribing = true;
    this.newsletterMessage = '';
    this.newsletterError = false;

    this.newsletterService.subscribe(this.newsletterControl.value!).subscribe({
      next: (res) => {
        this.isSubscribing = false;
        this.newsletterMessage = res.message;
        this.newsletterControl.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubscribing = false;
        this.newsletterError = true;
        this.newsletterMessage = err.error?.message || 'Subscription failed. Try again later.';
        this.cdr.detectChanges();
      }
    });
  }
}

