import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Recipe } from '../../core/models/types';
import { TimeFormatPipe } from '../pipes/time-format.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeFormatPipe],
  template: `
    <a [routerLink]="['/recipes', recipe.category.toLowerCase(), getSlug(recipe.title)]" class="recipe-card premium-hover">
      <div class="image-wrapper">
        <img [src]="getImageUrl(recipe.imageUrl) || getCategoryImage(recipe.category)"
             [alt]="recipe.title"
             (error)="onImageError($event, recipe.category)">
        <div class="card-overlay"></div>
        <div class="badges-top">
          <span class="difficulty-badge" [ngClass]="recipe.difficulty.toLowerCase()">
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
        <h4 class="playfair">{{ recipe.title }}</h4>
        <div class="author-row" *ngIf="showAuthor && recipe.owner">
          <span class="author-prefix">By&nbsp;</span><span class="author-name">{{ getOwnerName() }}</span>
        </div>
      </div>
    </a>
  `,
  styles: [`
    .recipe-card {
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
  `]
})
export class RecipeCardComponent {
  @Input({ required: true }) recipe!: Recipe;
  @Input() showAuthor: boolean = false;

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
