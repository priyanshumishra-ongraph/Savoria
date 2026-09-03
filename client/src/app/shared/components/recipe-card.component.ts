import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Recipe } from '../../core/models/types';
import { TimeFormatPipe } from '../pipes/time-format.pipe';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeFormatPipe],
  template: `
    <a [routerLink]="['/recipes', recipe._id]" class="recipe-card">
      <div class="image-wrapper">
        <img [src]="recipe.imageUrl || getCategoryImage(recipe.category)" [alt]="recipe.title">
        <div class="difficulty-badge" [ngClass]="recipe.difficulty.toLowerCase()">
          {{ recipe.difficulty }}
        </div>
      </div>
      <div class="recipe-info">
        <h4>{{ recipe.title }}</h4>
        <p class="category">{{ recipe.category }}</p>
        <div class="meta-footer">
          <span class="time">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {{ recipe.prepTimeMinutes | timeFormat }}
          </span>
          <span class="author" *ngIf="showAuthor && recipe.owner">
            By {{ getOwnerName() }}
          </span>
        </div>
      </div>
    </a>
  `,
  styles: [`
    .recipe-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.04);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: 1px solid #cbd5e0;
      cursor: pointer;
      display: block;
      text-decoration: none;
      color: inherit;
    }

    .recipe-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 25px rgba(0,0,0,0.08);
    }

    .image-wrapper {
      position: relative;
      height: 180px;
      width: 100%;
      background-color: #edf2f7;
      overflow: hidden;
    }

    .image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .recipe-card:hover .image-wrapper img {
      transform: scale(1.05);
    }

    .difficulty-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      backdrop-filter: blur(4px);
    }

    .difficulty-badge.easy { background: rgba(72, 187, 120, 0.9); color: white; }
    .difficulty-badge.medium { background: rgba(237, 137, 54, 0.9); color: white; }
    .difficulty-badge.hard { background: rgba(229, 62, 62, 0.9); color: white; }

    .recipe-info {
      padding: 16px;
    }

    .recipe-info h4 {
      margin: 0 0 6px 0;
      font-size: 18px;
      font-weight: 700;
      color: #1a202c;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .category {
      margin: 0;
      font-size: 14px;
      color: #a0aec0;
    }

    .meta-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed #e2e8f0;
    }

    .time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: #718096;
    }

    .author {
      font-size: 12px;
      color: #a0aec0;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }
  `]
})
export class RecipeCardComponent {
  @Input({ required: true }) recipe!: Recipe;
  @Input() showAuthor: boolean = false;

  getCategoryImage(category: string): string {
    const c = (category || 'other').toLowerCase();
    if (c === 'breakfast') return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80';
    if (c === 'lunch') return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80';
    if (c === 'dinner') return 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80';
    if (c === 'dessert') return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80';
    if (c === 'beverage') return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80';
    if (c === 'snack') return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80';
    return 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80';
  }

  getOwnerName(): string {
    if (!this.recipe.owner) return '';
    if (typeof this.recipe.owner === 'string') return 'Unknown';
    return this.recipe.owner.name || 'Unknown';
  }
}
