import { Component, Input, Output, EventEmitter, HostBinding, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Recipe } from '../../core/models/types';
import { TimeFormatPipe } from '../pipes/time-format.pipe';
import { environment } from '../../../environments/environment';
import { SaveToCollectionModalComponent } from './save-to-collection-modal.component';
import { FavoriteService } from '../../core/services/favorite.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeFormatPipe, SaveToCollectionModalComponent],
  template: `
    <a [routerLink]="['/recipes', recipe.category.toLowerCase(), getSlug(recipe.title)]" 
       class="recipe-card premium-hover">
      <div class="image-wrapper">
        <img [src]="getImageUrl(recipe.imageUrl) || getCategoryImage(recipe.category)"
             [alt]="recipe.title"
             (error)="onImageError($event, recipe.category)">
        <div class="card-overlay"></div>

        <button *ngIf="context === 'default'" class="favorite-btn" [class.is-favorite]="isFavorite" (click)="toggleFavorite($event)" title="Add to Favorites">
          <svg *ngIf="!isFavorite" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <svg *ngIf="isFavorite" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        
        <button *ngIf="context === 'default'" class="save-bookmark-btn" (click)="openSaveModal($event)" title="Save to Collection">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        <button *ngIf="context === 'collection'" class="remove-btn" (click)="onRemove($event)" title="Remove from Cookbook">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>

        <div class="badges-top" *ngIf="context !== 'collection'">
          <span class="difficulty-badge" [ngClass]="(recipe.difficulty || '').toLowerCase()">
            {{ recipe.difficulty }}
          </span>
        </div>
        <div class="badges-bottom">
          <span class="time-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {{ recipe.prepTimeMinutes | timeFormat }}
          </span>
        </div>
      </div>
      <div class="recipe-info">
        <p class="category">{{ recipe.category }}</p>
        <div class="title-row">
          <h4 class="playfair">{{ recipe.title }}</h4>
          <div class="inline-rating" *ngIf="recipe.averageRating">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span class="rating-val">{{ recipe.averageRating }}</span>
            <span class="review-count">({{ recipe.reviewCount }})</span>
          </div>
        </div>
        <div class="author-row" *ngIf="showAuthor && recipe.owner">
          <span class="author-prefix">By&nbsp;</span><span class="author-name">{{ getOwnerName() }}</span>
        </div>
      </div>
    </a>
    
    <app-save-to-collection-modal 
      *ngIf="showSaveModal" 
      [recipeId]="recipe._id" 
      [recipeDetails]="recipe" 
      (close)="showSaveModal = false"
      (saved)="onSaved()">
    </app-save-to-collection-modal>

    <div class="toast-notification" [class.show]="showToast">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>{{ toastMessage }}</span>
    </div>
  `,
  styles: [`
    .recipe-card {
      position: relative;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      height: 100%;
      text-decoration: none;
      color: inherit;
      border: 1px solid #d6d3d1; /* Warm stone border */
      transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
    }
    
    .recipe-card:hover {
      border-color: #ea580c; /* Terracotta border on hover */
      box-shadow: 0 10px 25px rgba(60, 34, 24, 0.08); /* Espresso shadow on hover */
      transform: translateY(-4px);
    }

    .image-wrapper {
      position: relative;
      height: 220px;
      width: 100%;
      background-color: #f4f4f5;
      overflow: hidden;
    }

    .image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .card-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 50%;
      background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.4));
      opacity: 0.8;
      transition: opacity 0.3s ease;
    }

    .recipe-card:hover .image-wrapper img {
      transform: scale(1.08);
    }

    .recipe-card:hover .card-overlay {
      opacity: 1;
    }

    .badges-top {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 2;
    }

    .badges-bottom {
      position: absolute;
      bottom: 14px;
      left: 14px;
      z-index: 2;
    }

    .difficulty-badge, .time-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      border-radius: 30px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    .difficulty-badge.easy { background: rgba(72, 187, 120, 0.85); color: white; }
    .difficulty-badge.medium { background: rgba(237, 137, 54, 0.85); color: white; }
    .difficulty-badge.hard { background: rgba(229, 62, 62, 0.85); color: white; }
    
    .time-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .recipe-info {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .category {
      margin: 0 0 6px 0;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #ea580c;
    }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }

    .inline-rating {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 13px;
      font-weight: 600;
      color: #3C2218;
      background: #faf5eb;
      padding: 4px 8px;
      border-radius: 12px;
      white-space: nowrap;
    }
    
    .inline-rating .review-count {
      font-size: 11px;
      color: #78716c;
      font-weight: 400;
    }

    .recipe-info h4 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1c1917;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .author-row {
      margin-top: auto;
      padding-top: 12px;
      font-size: 13px;
    }

    .author-prefix { color: #a8a29e; }
    .author-name { color: #57534e; font-weight: 500; }
    
    
      .favorite-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        z-index: 3;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #57534e;
        opacity: 0;
        transform: translateY(-5px);
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .recipe-card:hover .favorite-btn {
        opacity: 1;
        transform: translateY(0);
      }
      .favorite-btn:hover {
        background: #fef2f2;
        color: #ef4444;
        transform: scale(1.1) !important;
      }
      .favorite-btn.is-favorite {
        opacity: 1;
        transform: translateY(0);
      }

      .save-bookmark-btn {
      position: absolute;
      top: 14px;
      left: 14px;
      z-index: 3;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #3C2218;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      opacity: 0;
      transform: translateY(-5px);
    }
    
    .remove-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 4;
      background: #ef4444;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
      transition: all 0.2s;
      opacity: 0;
      transform: translateY(-5px);
    }
    
    .recipe-card:hover .save-bookmark-btn,
    .recipe-card:hover .remove-btn {
      opacity: 1;
      transform: translateY(0);
    }
    
    .save-bookmark-btn:hover {
      background: #ea580c;
      color: white;
      transform: scale(1.1);
    }
    
    .remove-btn:hover {
      background: #dc2626;
      transform: scale(1.05);
    }
    .toast-notification {
      position: fixed;
      bottom: -100px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 1rem 2rem;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
      transition: bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 100000;
    }
    .toast-notification.show {
      bottom: 2rem;
    }
  `]
})

export class RecipeCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) recipe!: Recipe;
  @Input() showAuthor: boolean = false;
  @Input() context: 'default' | 'collection' = 'default';
  @Output() remove = new EventEmitter<string>();
  
  showSaveModal = false;
  showToast = false;
  toastMessage = 'Recipe added to cookbook!';
  isFavorite = false;
  private favoriteService = inject(FavoriteService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  ngOnInit() {
    this.sub = this.favoriteService.favoriteIds$.subscribe(ids => {
      if (this.recipe) {
        this.isFavorite = ids.has(this.recipe._id);
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  toggleFavorite(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.authService.currentUserValue) {
      alert('Please log in to add favorites!');
      return;
    }
    
    if (this.isFavorite) {
      this.favoriteService.removeFavorite(this.recipe._id).subscribe(() => {
          this.showToastMessage('Removed from favorites!');
        });
    } else {
      this.favoriteService.addFavorite(this.recipe._id).subscribe(() => {
          this.showToastMessage('Recipe added to favorites!');
        });
    }
  }


  onSaved() {
    this.showSaveModal = false;
    this.showToastMessage('Recipe added to cookbook!');
  }

  showToastMessage(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  @HostBinding('style.z-index') get zIndex() {
    return this.showSaveModal ? 9999 : 'auto';
  }

  @HostBinding('style.position') get position() {
    return this.showSaveModal ? 'relative' : 'static';
  }

  openSaveModal(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showSaveModal = true;
  }

  onRemove(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.remove.emit(this.recipe._id);
  }

  getImageUrl(url: string | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}${url}`;
  }

  getCategoryImage(category: string): string {
    const images: Record<string, string> = {
      'Breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
      'Lunch': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      'Dinner': 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=800&q=80',
      'Dessert': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
      'Beverage': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80',
      'Snack': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80'
    };
    return images[category] || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80';
  }

  getSlug(title: string): string {
    return title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';
  }

  onImageError(event: Event, category: string): void {
    const img = event.target as HTMLImageElement;
    img.src = this.getCategoryImage(category);
    img.onerror = null; // prevent infinite loop if fallback also fails
  }

  getOwnerName(): string {
    if (!this.recipe.owner) return '';
    if (typeof this.recipe.owner === 'string') return 'Unknown';
    return this.recipe.owner.name || 'Unknown';
  }
}




