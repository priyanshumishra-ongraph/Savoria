import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CollectionService } from '../core/services/collection.service';
import { Collection, CollectionResponse } from '../core/models/types';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-collections-discover',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="collections-container">
      <div class="header-section">
        <div class="header-text">
          <h1>My Cookbooks</h1>
          <p>Organize and manage your curated recipe collections.</p>
        </div>
        <div class="header-actions">
          <div class="search-bar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search cookbooks...">
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading your collections...</p>
      </div>

      <div *ngIf="error && !loading" class="error-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p>{{ error }}</p>
        <button (click)="fetchCollections()" class="btn-retry">Try Again</button>
      </div>

      <div *ngIf="!loading && collections.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        </div>
        <h3>No Cookbooks Found</h3>
        <p>You haven't created any recipe collections yet.</p>
        <button routerLink="/discover" class="btn-primary">Explore Recipes</button>
      </div>

      <div class="collections-grid" *ngIf="!loading && collections.length > 0">
        <a *ngFor="let collection of collections" 
           [routerLink]="['/collections', createSlug(collection.name), collection._id]" 
           class="collection-card">
          <div class="card-cover">
            <img [src]="getCoverImage(collection)" [alt]="collection.name" (error)="onImageError($event)">
            <div class="overlay"></div>
          </div>
          <div class="card-info">
            <div class="card-header">
              <h3>{{ collection.name }}</h3>
              <span class="badge" [class.public]="collection.isPublic" [class.private]="!collection.isPublic">
                {{ collection.isPublic ? 'Public' : 'Private' }}
              </span>
            </div>
            <div class="card-meta">
              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>{{ collection.recipes.length }} Recipes</span>
              </div>
              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>Only you</span>
              </div>
            </div>
          </div>
        </a>
      </div>
      
      <div class="pagination" *ngIf="pages > 1">
        <button class="btn-page" [disabled]="page === 1" (click)="changePage(page - 1)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Previous
        </button>
        <span class="page-indicator">Page {{ page }} of {{ pages }}</span>
        <button class="btn-page" [disabled]="page === pages" (click)="changePage(page + 1)">
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .collections-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1.5rem;
    }
    
    .header-text h1 {
      color: #0f172a;
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 0 0 0.5rem 0;
    }
    
    .header-text p {
      color: #64748b;
      font-size: 1rem;
      margin: 0;
    }
    
    .header-actions {
      display: flex;
      gap: 1rem;
    }
    
    .search-bar {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.5rem 1rem;
      width: 280px;
      transition: all 0.2s;
    }
    
    .search-bar:focus-within {
      background: #fff;
      border-color: #cbd5e1;
      box-shadow: 0 0 0 3px rgba(241, 245, 249, 0.8);
    }
    
    .search-bar svg {
      color: #94a3b8;
      margin-right: 0.75rem;
    }
    
    .search-bar input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.95rem;
      width: 100%;
      color: #334155;
    }
    
    .search-bar input::placeholder {
      color: #94a3b8;
    }
    
    /* Loading & Error States */
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: #64748b;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f1f5f9;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin { 100% { transform: rotate(360deg); } }
    
    .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 5rem 2rem;
      background: #f8fafc;
      border-radius: 16px;
      border: 1px dashed #cbd5e1;
      margin-top: 2rem;
    }
    
    .empty-icon {
      color: #94a3b8;
      margin-bottom: 1.5rem;
      background: #f1f5f9;
      padding: 1.5rem;
      border-radius: 50%;
    }
    
    .empty-state h3 {
      color: #0f172a;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }
    
    .empty-state p, .error-state p {
      color: #64748b;
      margin: 0 0 2rem 0;
    }
    
    .btn-retry, .btn-primary {
      background: #ea580c;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
    }
    
    .btn-retry:hover, .btn-primary:hover {
      background: #334155;
    }
    
    /* Grid & Cards */
    .collections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }
    
    .collection-card {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .collection-card:hover {
      transform: translateY(-4px);
      border-color: #cbd5e1;
      box-shadow: 0 12px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
    }
    
    .card-cover {
      height: 180px;
      position: relative;
      background: #f1f5f9;
      overflow: hidden;
    }
    
    .card-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    
    .collection-card:hover .card-cover img {
      transform: scale(1.05);
    }
    
    .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 50%);
    }
    
    .card-info {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .card-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.4;
    }
    
    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .badge.private {
      background: #f1f5f9;
      color: #64748b;
    }
    
    .badge.public {
      background: #ecfdf5;
      color: #059669;
    }
    
    .card-meta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      margin-top: 4rem;
    }
    
    .page-indicator {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
    }
    
    .btn-page {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #0f172a;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-page:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    
    .btn-page:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class CollectionsDiscoverComponent implements OnInit {
  collections: Collection[] = [];
  loading = true;
  error: string | null = null;
  page = 1;
  pages = 1;
  
  private collectionService = inject(CollectionService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.fetchCollections();
  }

  createSlug(name: string): string {
    return name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'collection';
  }

  fetchCollections() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
    this.collectionService.getCollections(this.page, 6).subscribe({
      next: (res: CollectionResponse) => {
        this.collections = res.collections || [];
        this.page = res.page || 1;
        this.pages = res.pages || 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          this.error = 'Session expired. Please log in again.';
        } else if (err.status === 0) {
          this.error = 'Cannot connect to the server. Is the backend running on port 5000?';
        } else {
          this.error = `Failed to load cookbooks (Error ${err.status}). Please retry.`;
        }
        this.cdr.detectChanges();
      }
    });
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.pages) {
      this.page = newPage;
      this.fetchCollections();
    }
  }

  onImageError(event: any) {
    event.target.src = 'https://placehold.co/800x600/e2e8f0/475569?text=Cookbook';
  }

  getCoverImage(collection: Collection): string {
    if (collection.coverImage) {
      if (collection.coverImage.startsWith('http')) return collection.coverImage;
      return `${environment.apiUrl.replace(/\/api\/?$/, '')}${collection.coverImage}`;
    }
    // Fallback: use first recipe image or its category image
    if (collection.recipes && collection.recipes.length > 0) {
      const firstRecipe = collection.recipes[0];
      if (firstRecipe) {
        if (firstRecipe.imageUrl) {
          const url = firstRecipe.imageUrl;
          if (url.startsWith('http')) return url;
          return `${environment.apiUrl.replace(/\/api\/?$/, '')}${url}`;
        }
        // If no imageUrl, use category fallback
        if (firstRecipe.category) {
          return this.getCategoryImage(firstRecipe.category);
        }
      }
    }
    return 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80';
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
}
