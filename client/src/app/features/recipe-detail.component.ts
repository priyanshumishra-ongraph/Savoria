import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../core/services/recipe.service';
import { AuthService } from '../core/services/auth.service';
import { Recipe } from '../core/models/types';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationModalComponent } from '../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatSnackBarModule, ConfirmationModalComponent],
  template: `
    <div class="product-page-wrapper" *ngIf="recipe; else loadingOrError">
      <div class="product-main-container">
        
        <!-- Left: Image Section -->
        <div class="product-image-col">
          <div class="main-image-wrapper">
            <img [src]="getImageUrl(recipe.imageUrl) || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'" [alt]="recipe.title" class="main-image">
          </div>
          <div class="tags-row" *ngIf="recipe.tags && recipe.tags.length > 0">
            <span class="tag-badge" *ngFor="let tag of recipe.tags">#{{ tag }}</span>
          </div>
        </div>

        <!-- Right: Details Section -->
        <div class="product-details-col">
          <div class="breadcrumbs">
            <a routerLink="/">Home</a> / <a routerLink="/recipes">Recipes</a> / <span>{{ recipe.category }}</span>
          </div>
          
          <h1 class="product-title">{{ recipe.title }}</h1>
          <p class="product-author">By {{ getOwnerName() }}</p>

          <div class="specs-section">
            <h3 class="specs-heading">Time & Difficulty</h3>
            <div class="specs-grid">
              <div class="spec-box">
                <div class="spec-val">{{ recipe.prepTimeMinutes || 0 }} min</div>
                <div class="spec-label">Prep Time</div>
              </div>
              <div class="spec-box">
                <div class="spec-val">{{ recipe.cookTimeMinutes || 0 }} min</div>
                <div class="spec-label">Cook Time</div>
              </div>
              <div class="spec-box">
                <div class="spec-val">{{ recipe.difficulty || 'Unknown' }}</div>
                <div class="spec-label">Difficulty</div>
              </div>
            </div>
          </div>

          <div class="actions-section">
            <button class="add-to-cart-btn" *ngIf="!canEdit()" (click)="startCooking()">Start Cooking</button>
            <button class="add-to-cart-btn buy-btn" *ngIf="!canEdit()" (click)="buyIngredients()">
              <mat-icon style="vertical-align: middle; margin-right: 4px; font-size: 20px; width: 20px; height: 20px;">shopping_cart</mat-icon> Buy Ingredients
            </button>
            <button class="add-to-cart-btn edit-btn" *ngIf="canEdit()" [routerLink]="['/recipes/edit', recipe._id]">Edit Recipe</button>
            <button class="add-to-cart-btn delete-btn" *ngIf="canEdit()" (click)="deleteRecipe()">Delete</button>
          </div>

          <div class="product-info-sections">
            <div class="info-block" *ngIf="recipe.description">
              <h3>Description</h3>
              <p>{{ recipe.description }}</p>
            </div>
            
            <div class="info-block">
              <h3>Ingredients</h3>
              <ul class="ingredients-list">
                <li *ngFor="let item of recipe.ingredients || []">
                  <span class="ing-name">{{ item?.name }}</span>
                  <span class="ing-qty">{{ item?.quantity }}</span>
                </li>
              </ul>
            </div>

            <div class="info-block">
              <h3>Instructions</h3>
              <ol class="instructions-list">
                <li *ngFor="let step of recipe.steps || []">{{ step }}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom: Horizontal Scrolling Sections -->
      <div class="product-bottom-container">
        <div class="horizontal-section" *ngIf="similarRecipes.length > 0">
          <h3>Similar recipes in {{ recipe.category }}</h3>
          <div class="product-carousel">
            <div class="product-card" *ngFor="let r of similarRecipes" [routerLink]="['/recipes', r.category.toLowerCase(), getSlug(r.title)]">
              <div class="card-img-wrapper">
                <img [src]="getImageUrl(r.imageUrl) || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'" class="card-img">
                <div class="time-badge">
                  <mat-icon style="font-size:12px; width:12px; height:12px; margin-top:2px;">schedule</mat-icon>
                  {{ r.cookTimeMinutes || 0 }} MINS
                </div>
              </div>
              <h4 class="card-title">{{ r.title }}</h4>
              <p class="card-subtitle">{{ r.difficulty }}</p>
              <div class="card-bottom">
                <span class="card-price"></span>
                <button class="add-btn">VIEW</button>
              </div>
            </div>
          </div>
        </div>

        <div class="horizontal-section" *ngIf="otherRecipes.length > 0">
          <h3>People also cooked</h3>
          <div class="product-carousel">
            <div class="product-card" *ngFor="let r of otherRecipes" [routerLink]="['/recipes', r.category.toLowerCase(), getSlug(r.title)]">
              <div class="card-img-wrapper">
                <img [src]="getImageUrl(r.imageUrl) || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'" class="card-img">
                <div class="time-badge">
                  <mat-icon style="font-size:12px; width:12px; height:12px; margin-top:2px;">schedule</mat-icon>
                  {{ r.cookTimeMinutes || 0 }} MINS
                </div>
              </div>
              <h4 class="card-title">{{ r.title }}</h4>
              <p class="card-subtitle">{{ r.difficulty }}</p>
              <div class="card-bottom">
                <span class="card-price"></span>
                <button class="add-btn">VIEW</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingOrError>
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    </ng-template>

    <app-confirmation-modal
      [isOpen]="showDeleteConfirm"
      title="Delete Recipe"
      [message]="'Are you sure you want to completely delete ' + recipe?.title + '? This action cannot be undone.'"
      confirmText="Delete Recipe"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()">
    </app-confirmation-modal>

    <!-- Cooking Mode Overlay -->
    <div class="cooking-overlay" *ngIf="isCookingMode">
      <div class="cooking-header">
        <div class="header-left">
          <h2>{{ recipe?.title }}</h2>
          <span class="cooking-badge">Cooking Mode</span>
        </div>
        <button mat-icon-button (click)="exitCookingMode()" class="close-cooking-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="cooking-progress">
        <div class="progress-bar" [style.width]="((currentStepIndex + 1) / (recipe?.steps?.length || 1)) * 100 + '%'"></div>
      </div>
      
      <div class="cooking-body">
        <!-- Left Sidebar: Reference Info -->
        <div class="cooking-sidebar">
          <div class="sidebar-image" [style.backgroundImage]="'url(' + (getImageUrl(recipe?.imageUrl) || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80') + ')'"></div>
          <div class="sidebar-content">
            <h3>Ingredients Reference</h3>
            <ul class="cooking-ingredients">
              <li *ngFor="let item of recipe?.ingredients">
                <span class="ing-qty">{{ item?.quantity }}</span>
                <span class="ing-name">{{ item?.name }}</span>
              </li>
            </ul>
            <div class="cooking-meta">
              <span><mat-icon>schedule</mat-icon> Prep: {{ recipe?.prepTimeMinutes }}m</span>
              <span><mat-icon>whatshot</mat-icon> Cook: {{ recipe?.cookTimeMinutes }}m</span>
            </div>
          </div>
        </div>

        <!-- Right Main: Step Content -->
        <div class="cooking-main">
          <div class="step-content-wrapper">
            <div class="step-counter">Step {{ currentStepIndex + 1 }} of {{ recipe?.steps?.length }}</div>
            <p class="step-text">{{ recipe?.steps?.[currentStepIndex] }}</p>
          </div>
          
          <div class="cooking-controls">
            <button class="cooking-nav-btn btn-prev" (click)="prevStep()" [disabled]="currentStepIndex === 0">Previous</button>
            <button class="cooking-nav-btn btn-next" (click)="nextStep()" *ngIf="currentStepIndex < (recipe?.steps?.length || 1) - 1">Next Step</button>
            <button class="cooking-nav-btn btn-finish" (click)="exitCookingMode()" *ngIf="currentStepIndex === (recipe?.steps?.length || 1) - 1">Finish Cooking!</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mock Checkout Modal -->
    <div class="checkout-overlay" *ngIf="showCheckoutModal">
      <div class="checkout-modal">
        <div class="checkout-header">
          <h2>Grocery Checkout</h2>
          <button mat-icon-button (click)="closeCheckout()" [disabled]="isProcessingPayment">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <div class="checkout-body" *ngIf="!paymentSuccess">
          <div class="cart-items">
            <div class="cart-item" *ngFor="let item of mockCartItems">
              <span class="item-name">{{ item.quantity }} {{ item.name }}</span>
              <span class="item-price">{{ item.price | currency }}</span>
            </div>
          </div>
          
          <div class="cart-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ mockCartTotal | currency }}</span>
            </div>
            <div class="summary-row">
              <span>Delivery Fee</span>
              <span>$3.99</span>
            </div>
            <div class="summary-row">
              <span>Taxes</span>
              <span>{{ mockCartTotal * 0.08 | currency }}</span>
            </div>
            <div class="summary-row total-row">
              <span>Total</span>
              <span>{{ mockCartTotal + 3.99 + (mockCartTotal * 0.08) | currency }}</span>
            </div>
          </div>
          
          <div class="payment-section">
            <button class="pay-btn" (click)="processPayment()" [disabled]="isProcessingPayment">
              <mat-spinner *ngIf="isProcessingPayment" diameter="24" color="accent"></mat-spinner>
              <span *ngIf="!isProcessingPayment">Pay Now</span>
            </button>
          </div>
        </div>
        
        <div class="checkout-success" *ngIf="paymentSuccess">
          <div class="success-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h3>Payment Successful!</h3>
          <p>Your ingredients are being prepared and will be delivered shortly.</p>
          <button class="done-btn" (click)="closeCheckout()">Done</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-page-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px;
      font-family: 'Inter', sans-serif;
      color: #1a202c;
      background: white;
    }
    .product-main-container {
      display: grid;
      grid-template-columns: 45% 50%;
      gap: 5%;
      margin-bottom: 60px;
      padding-bottom: 40px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Left Column */
    .product-image-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .main-image-wrapper {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #edf2f7;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-start;
    }
    .tag-badge {
      padding: 6px 12px;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 13px;
      color: #4a5568;
      font-weight: 600;
    }

    /* Right Column */
    .product-details-col {
      display: flex;
      flex-direction: column;
    }
    .breadcrumbs {
      font-size: 13px;
      color: #718096;
      margin-bottom: 12px;
      font-weight: 500;
    }
    .breadcrumbs a {
      color: #4a5568;
      text-decoration: none;
    }
    .breadcrumbs a:hover {
      text-decoration: underline;
    }
    .product-title {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }
    .product-author {
      font-size: 15px;
      color: #718096;
      margin: 0 0 24px 0;
    }

    .specs-section {
      margin-bottom: 32px;
    }
    .specs-heading {
      font-size: 15px;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 12px 0;
    }
    .specs-grid {
      display: flex;
      gap: 12px;
    }
    .spec-box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      text-align: center;
      min-width: 100px;
      background: white;
    }
    .spec-box.selected {
      border: 2px solid #0c831f; /* Blinkit Green */
      background: #f3fbf4;
    }
    .spec-val {
      font-weight: 700;
      font-size: 15px;
      color: #1a202c;
      margin-bottom: 4px;
    }
    .spec-label {
      font-size: 12px;
      color: #718096;
    }

    .actions-section {
      display: flex;
      gap: 16px;
      margin-bottom: 40px;
    }
    .add-to-cart-btn {
      background: #0c831f;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      text-transform: uppercase;
      box-shadow: 0 4px 6px rgba(12, 131, 31, 0.2);
    }
    .add-to-cart-btn:hover {
      background: #0b731b;
    }
    .add-to-cart-btn.buy-btn {
      background: #ea580c;
      box-shadow: 0 4px 6px rgba(234, 88, 12, 0.2);
    }
    .add-to-cart-btn.buy-btn:hover {
      background: #c2410c;
    }
    .add-to-cart-btn.edit-btn {
      background: #2b6cb0;
      box-shadow: 0 4px 6px rgba(43, 108, 176, 0.2);
    }
    .add-to-cart-btn.delete-btn {
      background: white;
      color: #e53e3e;
      border: 1px solid #e53e3e;
      box-shadow: none;
    }
    .add-to-cart-btn.delete-btn:hover {
      background: #fff5f5;
    }

    .product-info-sections {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .info-block h3 {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 12px 0;
      color: #1a202c;
    }
    .info-block p {
      font-size: 15px;
      color: #4a5568;
      line-height: 1.6;
      margin: 0;
    }
    .ingredients-list {
      list-style: none; padding: 0; margin: 0;
      display: flex; flex-direction: column; gap: 8px;
    }
    .ingredients-list li {
      display: flex; justify-content: space-between;
      padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0;
      font-size: 15px; color: #4a5568;
    }
    .ing-name { font-weight: 500; color: #2d3748; }
    .ing-qty { font-weight: 700; color: #ea580c; }
    
    .instructions-list {
      padding-left: 20px; margin: 0;
      color: #4a5568; font-size: 15px; line-height: 1.6;
    }
    .instructions-list li { margin-bottom: 12px; padding-left: 8px; }

    /* Bottom Section */
    .product-bottom-container {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }
    .horizontal-section h3 {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 20px 0;
      color: #1a202c;
    }
    .product-carousel {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding-bottom: 20px;
      scrollbar-width: none;
    }
    .product-carousel::-webkit-scrollbar { display: none; }
    
    .product-card {
      min-width: 200px;
      max-width: 200px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      background: white;
      transition: box-shadow 0.2s;
    }
    .product-card:hover {
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
    }
    .card-img-wrapper {
      position: relative;
      width: 100%;
      height: 140px;
      margin-bottom: 12px;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .time-badge {
      position: absolute;
      bottom: 6px;
      left: 6px;
      background: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      color: #2d3748;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #2d3748;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-subtitle {
      font-size: 12px;
      color: #718096;
      margin: 0 0 12px 0;
    }
    .card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 28px;
    }
    .card-price {
      font-weight: 700;
      font-size: 14px;
      color: #1a202c;
    }
    .add-btn {
      background: white;
      border: 1px solid #0c831f;
      color: #0c831f;
      padding: 4px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      text-transform: uppercase;
      transition: background 0.2s;
    }
    .add-btn:hover {
      background: #f3fbf4;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }

    @media (max-width: 900px) {
      .product-main-container { grid-template-columns: 1fr; gap: 30px; }
      .specs-grid { flex-wrap: wrap; }
    }

    /* Cooking Mode Styles */
    .cooking-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: #ffffff; z-index: 9999;
      display: flex; flex-direction: column;
      animation: slideUp 0.3s ease-out;
    }
    .cooking-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 32px; border-bottom: 1px solid #e2e8f0; background: #ffffff;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-left h2 { margin: 0; font-size: 24px; color: #1a202c; font-weight: 800; }
    .cooking-badge { background: #ea580c; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .close-cooking-btn { color: #718096; transform: scale(1.2); }
    
    .cooking-progress { height: 8px; background: #f1f5f9; width: 100%; }
    .progress-bar { height: 100%; background: #ea580c; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    
    .cooking-body {
      flex: 1; display: flex; overflow: hidden;
    }
    
    .cooking-sidebar {
      width: 380px; background: #faf5eb; border-right: 1px solid #e2e8f0;
      display: flex; flex-direction: column;
    }
    .sidebar-image {
      height: 200px; background-size: cover; background-position: center;
      border-bottom: 4px solid #ea580c;
    }
    .sidebar-content {
      padding: 24px; overflow-y: auto; flex: 1;
    }
    .sidebar-content h3 { font-size: 18px; color: #ea580c; margin: 0 0 16px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .cooking-ingredients { list-style: none; padding: 0; margin: 0 0 24px 0; }
    .cooking-ingredients li { display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
    .cooking-ingredients li:last-child { border-bottom: none; }
    .cooking-ingredients .ing-qty { font-weight: 700; color: #ea580c; flex: 0 0 100px; word-wrap: break-word; }
    .cooking-ingredients .ing-name { color: #2d3748; font-weight: 500; }
    .cooking-meta { display: flex; flex-direction: column; gap: 12px; color: #718096; font-weight: 600; font-size: 14px; }
    .cooking-meta span { display: flex; align-items: center; gap: 8px; }
    
    .cooking-main {
      flex: 1; display: flex; flex-direction: column; background: #ffffff;
    }
    .step-content-wrapper {
      flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
      padding: 60px; text-align: center; overflow-y: auto;
    }
    .step-counter { font-size: 20px; color: #ea580c; font-weight: 700; margin-bottom: 32px; text-transform: uppercase; letter-spacing: 2px; }
    .step-text { font-size: 48px; font-weight: 800; color: #1a202c; line-height: 1.3; margin: 0; max-width: 900px; }
    
    .cooking-controls {
      display: flex; justify-content: space-between; padding: 24px 60px; border-top: 1px solid #e2e8f0; background: #ffffff;
    }
    .cooking-nav-btn {
      font-size: 18px; font-weight: 700; padding: 0 40px; height: 56px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .btn-prev {
      background: white; color: #4a5568; border: 2px solid #e2e8f0;
    }
    .btn-prev:hover:not([disabled]) { border-color: #cbd5e1; background: #f8fafc; }
    .btn-prev[disabled] { opacity: 0.5; cursor: not-allowed; }
    
    .btn-next, .btn-finish {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; border: none;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
    }
    .btn-next:hover, .btn-finish:hover {
      box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4); transform: translateY(-1px);
    }
    .btn-finish { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); }
    .btn-finish:hover { box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4); }
    
    @media (max-width: 900px) {
      .cooking-body { flex-direction: column-reverse; }
      .cooking-sidebar { width: 100%; height: 40%; border-right: none; border-top: 1px solid #e2e8f0; }
      .sidebar-image { display: none; }
      .step-text { font-size: 32px; }
      .step-content-wrapper { padding: 32px; }
      .cooking-controls { padding: 20px 32px; }
      .cooking-nav-btn { font-size: 16px; padding: 0 24px; height: 50px; }
    }

    /* Checkout Modal Styles */
    .checkout-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6); z-index: 10000;
      display: flex; justify-content: center; align-items: center;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .checkout-modal {
      background: white; width: 90%; max-width: 450px;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .checkout-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px; background: #faf5eb; border-bottom: 1px solid #e2e8f0;
    }
    .checkout-header h2 { margin: 0; font-size: 20px; color: #1a202c; font-weight: 800; }
    .checkout-body { padding: 24px; }
    .cart-items { max-height: 250px; overflow-y: auto; margin-bottom: 24px; padding-right: 8px; }
    .cart-items::-webkit-scrollbar { width: 6px; }
    .cart-items::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .cart-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #e2e8f0; }
    .item-name { color: #4a5568; font-weight: 500; font-size: 15px; }
    .item-price { color: #1a202c; font-weight: 700; font-size: 15px; }
    .cart-summary { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; color: #718096; font-size: 14px; }
    .total-row { font-size: 18px; font-weight: 800; color: #ea580c; margin-top: 12px; padding-top: 12px; border-top: 1px solid #cbd5e1; }
    .pay-btn {
      width: 100%; background: #16a34a; color: white; border: none;
      height: 54px; border-radius: 8px; font-size: 18px; font-weight: 800;
      cursor: pointer; transition: background 0.2s; display: flex; justify-content: center; align-items: center;
    }
    .pay-btn:hover:not([disabled]) { background: #15803d; }
    .pay-btn[disabled] { background: #86efac; cursor: not-allowed; }
    .checkout-success { padding: 48px 24px; text-align: center; }
    .success-icon { color: #16a34a; margin-bottom: 16px; }
    .success-icon mat-icon { font-size: 64px; width: 64px; height: 64px; }
    .checkout-success h3 { font-size: 24px; color: #1a202c; margin: 0 0 12px 0; font-weight: 800; }
    .checkout-success p { color: #718096; margin: 0 0 32px 0; font-size: 16px; line-height: 1.5; }
    .done-btn {
      background: #ea580c; color: white; border: none; padding: 0 32px; height: 48px;
      border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.2s;
    }
    .done-btn:hover { background: #c2410c; }
  `]
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  recipe: Recipe | null = null;
  currentUser: any = null;
  similarRecipes: Recipe[] = [];
  otherRecipes: Recipe[] = [];
  showDeleteConfirm = false;

  getImageUrl(url: string | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}${url}`;
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    
    if (isPlatformBrowser(this.platformId)) {
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        const category = params.get('category');
        const titleSlug = params.get('titleSlug');
        
        if (category && titleSlug) {
          this.fetchRecipeDataBySlug(category, titleSlug);
        } else if (id) {
          this.fetchRecipeData(id);
        }
      });
    }
  }

  fetchRecipeDataBySlug(category: string, titleSlug: string) {
    this.recipe = null;
    this.cdr.detectChanges();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });

    this.recipeService.getRecipeBySlug(category, titleSlug).subscribe({
      next: (data) => {
        this.recipe = data;
        this.cdr.detectChanges();
        this.fetchRelatedRecipes();
      },
      error: (err) => {
        console.error('Failed to load recipe', err);
        this.router.navigate(['/recipes']);
      }
    });
  }

  getSlug(title: string): string {
    return title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';
  }

  fetchRecipeData(id: string) {
    this.recipe = null; // show loader
    this.cdr.detectChanges();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });

    this.recipeService.getRecipeById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        this.cdr.detectChanges();
        this.fetchRelatedRecipes();
      },
      error: (err) => {
        console.error('Failed to load recipe', err);
        this.router.navigate(['/recipes']);
      }
    });
  }

  fetchRelatedRecipes() {
    // Fetch similar recipes (same category)
    this.recipeService.getRecipes('', this.recipe!.category).subscribe(res => {
      this.similarRecipes = res.recipes.filter((r: any) => r._id !== this.recipe!._id).slice(0, 4);
      this.cdr.detectChanges();
    });

    // Fetch other recipes (different category)
    this.recipeService.getRecipes('').subscribe(res => {
      this.otherRecipes = res.recipes.filter((r: any) => r.category !== this.recipe!.category && r._id !== this.recipe!._id).slice(0, 4);
      this.cdr.detectChanges();
    });
  }

  canEdit(): boolean {
    if (!this.currentUser || !this.recipe || !this.recipe.owner) return false;
    return this.currentUser._id === (typeof this.recipe.owner === 'object' ? this.recipe.owner._id : this.recipe.owner) || this.currentUser.role === 'admin';
  }

  getOwnerName(): string {
    if (this.recipe && this.recipe.owner && typeof this.recipe.owner === 'object' && this.recipe.owner.name) {
      return this.recipe.owner.name;
    }
    return 'Unknown';
  }

  deleteRecipe() {
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    this.showDeleteConfirm = false;
    if (this.recipe) {
      this.recipeService.deleteRecipe(this.recipe._id).subscribe(() => {
        this.snackBar.open('The recipe has been deleted.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        this.router.navigate(['/dashboard']);
      });
    }
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
  }
  
  showCheckoutModal = false;
  isProcessingPayment = false;
  paymentSuccess = false;
  mockCartItems: any[] = [];
  mockCartTotal = 0;
  
  buyIngredients() {
    this.mockCartItems = [];
    this.mockCartTotal = 0;
    
    if (this.recipe?.ingredients) {
      this.recipe.ingredients.forEach(ing => {
        // Generate a deterministic mock price between $1.50 and $9.50 based on the ingredient name
        const mockPrice = 1.5 + ((ing.name?.length || 5) % 8);
        this.mockCartItems.push({
          name: ing.name,
          quantity: ing.quantity,
          price: mockPrice
        });
        this.mockCartTotal += mockPrice;
      });
    } else {
      this.mockCartTotal = 15.99;
    }
    
    this.isProcessingPayment = false;
    this.paymentSuccess = false;
    this.showCheckoutModal = true;
  }

  closeCheckout() {
    this.showCheckoutModal = false;
  }

  processPayment() {
    this.isProcessingPayment = false;
    this.paymentSuccess = true;
  }

  isCookingMode = false;
  currentStepIndex = 0;
  
  startCooking() {
    if (this.recipe && this.recipe.steps && this.recipe.steps.length > 0) {
      this.isCookingMode = true;
      this.currentStepIndex = 0;
      document.body.style.overflow = 'hidden';
    }
  }
  
  exitCookingMode() {
    this.isCookingMode = false;
    document.body.style.overflow = '';
  }
  
  nextStep() {
    if (this.recipe && this.recipe.steps && this.currentStepIndex < this.recipe.steps.length - 1) {
      this.currentStepIndex++;
    }
  }
  
  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    }
  }
}
