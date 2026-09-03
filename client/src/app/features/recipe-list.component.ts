import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div class="header-content">
          <div class="title-area">
            <h2>Explore Categories</h2>
            <p>What are you craving today?</p>
          </div>
          
        </div>
      </div>

      <div class="dashboard-content">
        <div class="category-grid">
          <a *ngFor="let cat of categories" [routerLink]="['/recipes/category', cat.name]" class="category-card">
            <div class="card-bg" [style.background-image]="'url(' + cat.image + ')'"></div>
            <div class="card-overlay"></div>
            <div class="card-content">
              <h3>{{ cat.name }}</h3>
              <div class="explore-btn">
                Explore
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
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
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-area h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      color: #1a202c;
      letter-spacing: -0.5px;
    }

    .title-area p {
      margin: 4px 0 0;
      color: #718096;
      font-size: 15px;
    }

    .dashboard-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .category-card {
      position: relative;
      aspect-ratio: 3 / 4;
      border-radius: 20px;
      overflow: hidden;
      display: block;
      text-decoration: none;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
    }

    .category-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 35px rgba(0,0,0,0.12);
    }

    .card-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .category-card:hover .card-bg {
      transform: scale(1.08);
    }

    .card-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%);
    }

    .card-content {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .card-content h3 {
      margin: 0;
      color: white;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .explore-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: white;
      font-weight: 600;
      font-size: 14px;
      background: rgba(255,255,255,0.2);
      padding: 8px 14px;
      border-radius: 20px;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.3);
      transition: background 0.2s ease;
    }

    .category-card:hover .explore-btn {
      background: #f97316;
      border-color: #f97316;
    }
  `]
})
export class RecipeListComponent {
  categories = [
    { name: 'Breakfast', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80' },
    { name: 'Lunch', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
    { name: 'Dinner', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80' },
    { name: 'Dessert', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80' },
    { name: 'Beverage', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80' },
    { name: 'Snack', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800&q=80' }
  ];
}