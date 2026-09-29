import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionService } from '../../core/services/collection.service';
import { Collection } from '../../core/models/types';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-save-to-collection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <div class="header-left">
            <div class="header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <span>Save to Cookbook</span>
          </div>
          <button class="close-btn" (click)="close.emit()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- AI Smart Suggestion Banner -->
        <div class="ai-banner" *ngIf="smartFolderSuggestion && !loading">
          <div class="ai-banner-left">
            <div class="ai-sparkle">&#10024;</div>
            <div class="ai-text">
              <span class="ai-label">AI Suggestion</span>
              <span class="ai-value">Save to <strong>{{ smartFolderSuggestion }}</strong></span>
            </div>
          </div>
          <button class="btn-ai-save" (click)="saveToSmartFolder()" [disabled]="isSaving || isCreating">
            <span *ngIf="isCreating" class="spin-sm"></span>
            <span *ngIf="!isCreating">{{ isExistingSmartFolder() ? 'Quick Save' : 'Create & Save' }}</span>
          </button>
        </div>

        <!-- Body: Scrollable List -->
        <div class="modal-body">
          <!-- Loading -->
          <div *ngIf="loading" class="state-center">
            <div class="spinner"></div>
            <p>Loading your cookbooks...</p>
          </div>

          <!-- Empty -->
          <div *ngIf="!loading && collections.length === 0" class="state-center empty">
            <div class="empty-icon">&#128218;</div>
            <p>No cookbooks yet.</p>
            <span>Create one below to get started!</span>
          </div>

          <!-- Collection List -->
          <ul *ngIf="!loading && collections.length > 0" class="coll-list">
            <li *ngFor="let coll of collections" class="coll-item" [class.is-saved]="isInCollection(coll)">
              <div class="coll-left">
                <div class="coll-thumb" [class.thumb-saved]="isInCollection(coll)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div class="coll-meta">
                  <span class="coll-name">{{ coll.name }}</span>
                  <span class="coll-count">{{ coll.recipes.length || 0 }} recipe{{ coll.recipes.length !== 1 ? 's' : '' }}</span>
                </div>
              </div>
              <button
                class="btn-save"
                [class.saved]="isInCollection(coll)"
                [disabled]="isInCollection(coll) || isSaving"
                (click)="saveToCollection(coll)">
                <svg *ngIf="isInCollection(coll)" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {{ isInCollection(coll) ? 'Saved' : 'Save' }}
              </button>
            </li>
          </ul>
        </div>

        <!-- Footer: Create New -->
        <div class="modal-footer">
          <div class="footer-label">Create new cookbook</div>
          <div class="footer-row">
            <input
              type="text"
              [(ngModel)]="newCollectionName"
              placeholder="e.g. Sunday Brunches..."
              class="footer-input"
              (keydown.enter)="createCollection()">
            <button
              class="btn-create"
              [disabled]="!newCollectionName.trim() || isCreating"
              (click)="createCollection()">
              <span *ngIf="isCreating" class="spin-sm white"></span>
              <svg *ngIf="!isCreating" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Create
            </button>
          </div>
          <label class="public-row" *ngIf="newCollectionName.trim()">
            <input type="checkbox" [(ngModel)]="isPublic" class="pub-check">
            <span class="pub-label">Make this cookbook public</span>
          </label>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ─── Overlay ─────────────────────────────────────────── */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }

    /* ─── Modal Shell ──────────────────────────────────────── */
    .modal {
      background: #ffffff;
      border-radius: 20px;
      width: 100%;
      max-width: 420px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.06),
        0 4px 6px -2px rgba(0,0,0,0.05),
        0 24px 48px -8px rgba(0,0,0,0.14);
      animation: popIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    @keyframes popIn {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }

    /* ─── Header ───────────────────────────────────────────── */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.1rem 1.25rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      flex-shrink: 0;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .header-icon {
      width: 32px;
      height: 32px;
      background: #fff7ed;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ea580c;
      flex-shrink: 0;
    }
    .close-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: #f8fafc;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .close-btn:hover { background: #e2e8f0; color: #0f172a; }

    /* ─── AI Banner ────────────────────────────────────────── */
    .ai-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      background: linear-gradient(135deg, #fdf4ff 0%, #f0e6ff 100%);
      border-bottom: 1px solid #e9d5ff;
      gap: 1rem;
      flex-shrink: 0;
    }
    .ai-banner-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .ai-sparkle {
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .ai-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .ai-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #9333ea;
    }
    .ai-value {
      font-size: 0.88rem;
      color: #4c1d95;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ai-value strong { font-weight: 700; }

    .btn-ai-save {
      flex-shrink: 0;
      background: #9333ea;
      color: white;
      border: none;
      padding: 0.45rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.18s;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .btn-ai-save:hover:not(:disabled) { background: #7e22ce; }
    .btn-ai-save:disabled { opacity: 0.55; cursor: not-allowed; }

    /* ─── Modal Body (scrollable) ─────────────────────────── */
    .modal-body {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      background: #f8fafc;
      padding: 0.5rem;
    }
    .modal-body::-webkit-scrollbar { width: 5px; }
    .modal-body::-webkit-scrollbar-track { background: transparent; }
    .modal-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    /* Loading / Empty states */
    .state-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      color: #94a3b8;
      text-align: center;
      gap: 0.5rem;
    }
    .state-center p { margin: 0; font-size: 0.9rem; font-weight: 500; color: #64748b; }
    .state-center span { font-size: 0.8rem; }
    .empty-icon { font-size: 2rem; }
    .spinner {
      width: 24px; height: 24px;
      border: 3px solid #f1f5f9;
      border-top-color: #ea580c;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 0.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── Collection List ─────────────────────────────────── */
    .coll-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }

    .coll-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: white;
      border-radius: 12px;
      border: 1.5px solid #e2e8f0;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .coll-item:hover { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .coll-item.is-saved { border-color: #d1fae5; background: #f0fdf4; }

    .coll-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .coll-thumb {
      width: 38px; height: 38px;
      border-radius: 10px;
      background: #fff7ed;
      color: #ea580c;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .coll-thumb.thumb-saved { background: #d1fae5; color: #059669; }
    .coll-meta { display: flex; flex-direction: column; min-width: 0; }
    .coll-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .coll-count { font-size: 0.75rem; color: #94a3b8; }

    /* Save button per row */
    .btn-save {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      border: 1.5px solid #ea580c;
      background: white;
      color: #ea580c;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s;
    }
    .btn-save:hover:not(:disabled):not(.saved) { background: #ea580c; color: white; }
    .btn-save.saved { background: #10b981; border-color: #10b981; color: white; }
    .btn-save:disabled:not(.saved) { opacity: 0.45; cursor: not-allowed; }

    /* ─── Footer ───────────────────────────────────────────── */
    .modal-footer {
      padding: 0.9rem 1.25rem 1rem;
      border-top: 1px solid #f1f5f9;
      background: white;
      flex-shrink: 0;
    }
    .footer-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 0.6rem;
    }
    .footer-row { display: flex; gap: 8px; }
    .footer-input {
      flex: 1;
      min-width: 0;
      padding: 0.6rem 0.9rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.875rem;
      color: #1e293b;
      outline: none;
      transition: border-color 0.18s, box-shadow 0.18s;
      background: #f8fafc;
    }
    .footer-input::placeholder { color: #94a3b8; }
    .footer-input:focus {
      background: white;
      border-color: #ea580c;
      box-shadow: 0 0 0 3px rgba(234,88,12,0.08);
    }
    .btn-create {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 0.6rem 1rem;
      background: #ea580c;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.18s;
      white-space: nowrap;
    }
    .btn-create:hover:not(:disabled) { background: #c2410c; }
    .btn-create:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Public toggle */
    .public-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 0.6rem;
      cursor: pointer;
    }
    .pub-check { accent-color: #ea580c; width: 14px; height: 14px; cursor: pointer; }
    .pub-label { font-size: 0.8rem; color: #64748b; }

    /* Tiny spinners */
    .spin-sm {
      display: inline-block;
      width: 12px; height: 12px;
      border: 2px solid rgba(0,0,0,0.15);
      border-top-color: #9333ea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spin-sm.white { border: 2px solid rgba(255,255,255,0.3); border-top-color: white; }
  `]
})
export class SaveToCollectionModalComponent implements OnInit {
  @Input() recipeId!: string;
  @Input() recipeDetails?: any;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private collectionService = inject(CollectionService);
  private cdr = inject(ChangeDetectorRef);

  collections: Collection[] = [];
  loading = true;
  isSaving = false;
  isCreating = false;
  newCollectionName = '';
  isPublic = false;
  smartFolderSuggestion = '';

  ngOnInit() {
    this.fetchCollections();
    this.generateSmartFolderSuggestion();
  }

  generateSmartFolderSuggestion() {
    if (!this.recipeDetails) return;
    const r = this.recipeDetails;
    const name = (r.title || '').toLowerCase();
    const cat  = (r.category || '').toLowerCase();
    const tags = (r.tags || []).join(' ').toLowerCase();
    const all  = name + ' ' + tags;
    const time = (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0);

    // 1. Dietary identifiers (strongest signal)
    if (all.includes('vegan') || all.includes('plant-based') || all.includes('tofu') || all.includes('tempeh')) {
      this.smartFolderSuggestion = 'Vegan Friendly';
    }
    // 2. Desserts / sweets
    else if (cat === 'dessert' || all.includes('cake') || all.includes('cookie') || all.includes('brownie') || all.includes('pudding') || all.includes('sweet') || all.includes('chocolate')) {
      this.smartFolderSuggestion = 'Sweet Treats';
    }
    // 3. Breakfast
    else if (cat === 'breakfast' || all.includes('pancake') || all.includes('waffle') || all.includes('oatmeal') || all.includes('granola') || all.includes('smoothie')) {
      this.smartFolderSuggestion = 'Morning Fuel';
    }
    // 4. High protein / meats
    else if (all.includes('chicken') || all.includes('beef') || all.includes('steak') || all.includes('salmon') || all.includes('tuna') || all.includes('lamb') || all.includes('pork')) {
      this.smartFolderSuggestion = 'High Protein Dinners';
    }
    // 5. Soups / salads
    else if (all.includes('soup') || all.includes('stew') || all.includes('chowder') || all.includes('salad')) {
      this.smartFolderSuggestion = 'Soups & Salads';
    }
    // 6. Quick meals — time-based only after keyword checks
    else if (time > 0 && time <= 25) {
      this.smartFolderSuggestion = 'Quick & Easy Meals';
    }
    // 7. Category fallbacks
    else if (cat === 'dinner' || cat === 'lunch') {
      this.smartFolderSuggestion = 'Weeknight Dinners';
    } else if (cat === 'snack' || cat === 'appetizer') {
      this.smartFolderSuggestion = 'Party Snacks';
    } else if (cat === 'beverage') {
      this.smartFolderSuggestion = 'Drinks & Beverages';
    }
    // 8. Generic fallback
    else {
      this.smartFolderSuggestion = 'Weekend Favorites';
    }
  }

  isExistingSmartFolder(): boolean {
    return !!this.collections.find(c => c.name.toLowerCase() === this.smartFolderSuggestion.toLowerCase());
  }

  saveToSmartFolder() {
    if (!this.smartFolderSuggestion) return;
    const existing = this.collections.find(c => c.name.toLowerCase() === this.smartFolderSuggestion.toLowerCase());
    if (existing) { this.saveToCollection(existing); return; }

    this.isCreating = true;
    this.collectionService.createCollection({ name: this.smartFolderSuggestion, isPublic: false }).subscribe({
      next: (col) => {
        this.collections.unshift(col);
        this.isCreating = false;
        this.cdr.detectChanges();
        this.saveToCollection(col);
      },
      error: () => { this.isCreating = false; this.cdr.detectChanges(); }
    });
  }

  fetchCollections() {
    this.loading = true;
    this.collectionService.getCollections(1, 100).subscribe({
      next: (res) => { this.collections = res.collections || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.collections = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  isInCollection(collection: Collection): boolean {
    if (!collection.recipes) return false;
    return collection.recipes.some(r => {
      if (!r) return false;
      if (typeof r === 'string') return r === this.recipeId;
      return r._id === this.recipeId;
    });
  }

  saveToCollection(collection: Collection) {
    if (this.isInCollection(collection)) return;
    this.isSaving = true;
    this.collectionService.addRecipeToCollection(collection._id, this.recipeId).subscribe({
      next: (updated) => {
        const idx = this.collections.findIndex(c => c._id === updated._id);
        if (idx !== -1) this.collections[idx] = updated;
        this.isSaving = false;
        this.saved.emit();
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }

  createCollection() {
    if (!this.newCollectionName.trim()) return;
    this.isCreating = true;
    this.collectionService.createCollection({ name: this.newCollectionName, isPublic: this.isPublic }).subscribe({
      next: (col) => {
        this.collections.unshift(col);
        this.newCollectionName = '';
        this.isPublic = false;
        this.isCreating = false;
        this.cdr.detectChanges();
        this.saveToCollection(col);
      },
      error: () => { this.isCreating = false; this.cdr.detectChanges(); }
    });
  }
}
