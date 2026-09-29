import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CollectionService } from '../core/services/collection.service';
import { Collection } from '../core/models/types';
import { RecipeCardComponent } from '../shared/components/recipe-card.component';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../core/services/auth.service';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, RecipeCardComponent, FormsModule, MatSnackBarModule],
  template: `
    <div *ngIf="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading collection...</p>
    </div>

    <div class="collection-detail" *ngIf="!loading && collection">

      <!-- ══ Modern Collection Header ══════════════════════════════ -->
      <div class="modern-header">
        <div class="cover-wrapper">
          <img [src]="getCoverImage(collection)" alt="Cover" class="cover-image" (error)="onImageError($event)" />
          <div class="cover-badge" *ngIf="collection.recipes.length > 0">
            🍲 {{ collection.recipes.length }} Recipes
          </div>
        </div>

        <div class="header-info">
          
          <div class="header-top">
            
            <div class="header-top-left">
              <h1 class="col-title">{{ collection.name }}</h1>
              <p class="col-desc">{{ $any(collection).description || 'A beautiful collection of handpicked recipes.' }}</p>
              <div class="action-buttons">
                <button class="btn-icon" title="Share" (click)="shareCollection()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  Share
                </button>
                <button class="btn-icon danger" *ngIf="isOwner" (click)="confirmDeleteCookbook()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Delete
                </button>
              </div>
            </div>

            <div class="header-collab">
              <div class="facepile">
                <span class="facepile-lbl">Collaborators</span>
                <div class="face owner" title="{{ $any(collection.user).name || 'Owner' }} (Owner)">
                  {{ ($any(collection.user).name || 'O').charAt(0).toUpperCase() }}
                </div>
                <div class="face" *ngFor="let c of collection.collaborators" title="{{ c.name || 'Collaborator' }}">
                  {{ (c.name || 'C').charAt(0).toUpperCase() }}
                  <button class="remove-face" *ngIf="isOwner" (click)="removeCollaborator(c._id)">×</button>
                </div>
              </div>
              <div class="invite-box" *ngIf="isOwner">
                <input type="email" placeholder="Invite by email..." [(ngModel)]="newCollabEmail" (keydown.enter)="addCollaborator()">
                <button (click)="addCollaborator()" [disabled]="isAddingCollab || !newCollabEmail">Invite</button>
              </div>
            </div>

          </div>

          <div class="header-stats" *ngIf="collection.recipes.length > 0">
            <div class="stat-mini">
              <span class="sm-lbl">Avg Prep</span>
              <span class="sm-val">{{ getAvgPrepTime() || '—' }} <small *ngIf="getAvgPrepTime()">min</small></span>
            </div>
            <div class="stat-mini">
              <span class="sm-lbl">Avg Cook</span>
              <span class="sm-val">{{ getAvgCookTime() || '—' }} <small *ngIf="getAvgCookTime()">min</small></span>
            </div>
            <div class="stat-mini">
              <span class="sm-lbl">Total Time</span>
              <span class="sm-val">{{ getAvgTotalTime() || '—' }} <small *ngIf="getAvgTotalTime()">min</small></span>
            </div>
            <div class="stat-mini">
              <span class="sm-lbl">Difficulty</span>
              <div class="mini-chips">
                <span class="mc easy" *ngIf="getDifficultyCount('Easy') > 0">✅ {{ getDifficultyCount('Easy') }} Easy</span>
                <span class="mc med" *ngIf="getDifficultyCount('Medium') > 0">⚡ {{ getDifficultyCount('Medium') }} Med</span>
                <span class="mc hard" *ngIf="getDifficultyCount('Hard') > 0">🔥 {{ getDifficultyCount('Hard') }} Hard</span>
              </div>
            </div>
            <div class="stat-mini" *ngIf="getTopCategories().length > 0">
              <span class="sm-lbl">Top Categories</span>
              <div class="mini-chips">
                <span class="mc cat" *ngFor="let cat of getTopCategories()">{{ cat }}</span>
              </div>
            </div>
          </div>
          
          <div class="header-stats empty-stats" *ngIf="collection.recipes.length === 0">
             <p>No recipes added yet. Start adding recipes to see average macros and stats!</p>
          </div>

        </div>
      </div>
      <!-- ══ End Modern Header ═════════════════════════════════════ -->
      <div class="recipes-grid" *ngIf="collection.recipes.length > 0">
        <div class="recipe-wrapper" *ngFor="let recipe of collection.recipes">
          <app-recipe-card 
            [recipe]="recipe" 
            [showAuthor]="true"
            [context]="isOwner ? 'collection' : 'default'"
            (remove)="confirmRemove($event)">
          </app-recipe-card>
        </div>
      </div>
      
      <div class="empty-state" *ngIf="collection.recipes.length === 0">
        <h3>This collection is empty.</h3>
        <p>Go to the dashboard to find and save recipes!</p>
        <a routerLink="/dashboard" class="btn-explore">Explore Recipes</a>
      </div>
    </div>

    <div class="confirm-modal-backdrop" *ngIf="showConfirmModal || showCookbookConfirmModal">
      <div class="confirm-modal" *ngIf="showConfirmModal">
        <h3>Remove Recipe?</h3>
        <p>Are you sure you want to remove <strong>{{recipeToRemoveTitle}}</strong> from this cookbook?</p>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="cancelRemove()">Cancel</button>
          <button class="btn-delete" (click)="executeRemove()">Yes, Remove</button>
        </div>
      </div>
      <div class="confirm-modal" *ngIf="showCookbookConfirmModal">
        <h3>Delete Cookbook?</h3>
        <p>Are you sure you want to completely delete <strong>{{collection?.name}}</strong>? This cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="cancelDeleteCookbook()">Cancel</button>
          <button class="btn-delete" (click)="executeDeleteCookbook()">Yes, Delete</button>
        </div>
      </div>
    </div>
    
    <div class="toast-notification" [class.show]="showToast">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>{{toastMessage}}</span>
    </div>
  `,
  styles: [`
    .collection-detail {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 2rem 6rem;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      color: #64748b;
      font-family: 'Inter', sans-serif;
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

    /* ── Analytics Panel ───────────────────────────────────── */
    .analytics-panel {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04);
    }
    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .analytics-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .analytics-icon { font-size: 1.1rem; }
    .analytics-badge {
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
    }
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 680px) {
      .analytics-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border-radius: 12px;
      padding: 0.875rem 1rem;
      border: 1px solid #f1f5f9;
      transition: box-shadow 0.2s;
    }
    .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07); }
    .stat-icon {
      font-size: 1.4rem;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon.prep  { background: #f0fdf4; }
    .stat-icon.cook  { background: #fff7ed; }
    .stat-icon.total { background: #fdf4ff; }
    .stat-icon.ingr  { background: #f0f9ff; }
    .stat-body {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 500;
      white-space: nowrap;
    }
    .difficulty-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .diff-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-right: 0.25rem;
    }
    .diff-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .diff-pill {
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.2rem 0.65rem;
      border-radius: 20px;
    }
    .diff-pill.easy   { background: #f0fdf4; color: #16a34a; }
    .diff-pill.medium { background: #fffbeb; color: #d97706; }
    .diff-pill.hard   { background: #fff1f2; color: #e11d48; }
    .category-pills {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      margin-left: auto;
    }
    .cat-pill {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.2rem 0.65rem;
      border-radius: 20px;
    }
    /* ── End Analytics Panel ─────────────────────────────────── */

    /* -- Unified Collection Card --------------------------- */
    /* ── Modern Collection Header ───────────────────────────── */
    .modern-header {
      display: flex;
      gap: 2.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 2rem;
      margin-bottom: 3rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 30px -5px rgba(0,0,0,0.06);
    }
          @media (max-width: 1000px) and (min-width: 601px) {
        .header-top { flex-direction: column; gap: 1.5rem; align-items: flex-start; }
        .header-collab { align-items: flex-start; width: 100%; }
        .facepile { justify-content: flex-start; }
        .invite-box { justify-content: flex-start; width: 100%; }
      }

      @media (max-width: 600px) {
        .modern-header { flex-direction: column; padding: 1.5rem; gap: 1.5rem; text-align: center; }
        .cover-wrapper { width: 100%; height: auto; aspect-ratio: 1; max-height: 400px; margin: 0 auto; }
        .header-top { flex-direction: column; align-items: center; gap: 1.5rem; width: 100%; }
        .header-top-left { display: flex; flex-direction: column; align-items: center; width: 100%; text-align: center; }
        .header-collab { align-items: center; width: 100%; display: flex; flex-direction: column; }
        .facepile { justify-content: center; }
        .invite-box { justify-content: center; width: 100%; display: flex; max-width: 400px; margin: 0 auto; }
        .invite-box input { flex: 1; width: 100%; min-width: 0; text-align: center; }
        .col-title { font-size: 2.2rem; text-align: center; }
        .col-desc { text-align: center; }
        .action-buttons { margin-top: 0; padding-top: 0.5rem; justify-content: center; width: 100%; }
      }
    
    .cover-wrapper {
      position: relative;
      flex-shrink: 0;
      width: 280px;
      height: 280px;
    }
    .cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
    }
    .cover-badge {
      position: absolute;
      bottom: 12px;
      left: 12px;
      background: rgba(15, 23, 42, 0.75);
      color: white;
      backdrop-filter: blur(8px);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .header-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 2rem;
    }
    .header-top-left {
      display: flex;
      flex-direction: column;
    }
    .col-title {
      font-size: 2.8rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .col-desc {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0;
      font-weight: 500;
    }
    .action-buttons {
      display: flex;
      gap: 0.75rem;
      margin-top: auto;
      padding-top: 1.25rem;
    }
    .btn-icon {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0.55rem 1rem;
      background: #f8fafc;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      height: 42px;
    }
    .btn-icon:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .btn-icon.danger { color: #ef4444; border-color: #fca5a5; background: #fef2f2; }
    .btn-icon.danger:hover { background: #fee2e2; border-color: #f87171; }

    .header-collab {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.75rem;
      padding-top: 0;
    }
    .facepile { display: flex; align-items: center; gap: 0; padding-left: 12px; justify-content: flex-end; }
    .facepile-lbl { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 12px; margin-left: -12px; }
    .face {
      width: 40px; height: 40px; border-radius: 50%;
      background: #f1f5f9; color: #475569; font-size: 0.9rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white; position: relative; cursor: default;
      box-shadow: 0 2px 5px rgba(0,0,0,0.08);
      margin-left: -12px;
      transition: transform 0.2s, z-index 0.2s;
    }
    .face:hover { transform: translateY(-3px); z-index: 10 !important; }
    .face.owner { background: #dcfce7; color: #166534; z-index: 3; }
    .face:nth-child(2) { z-index: 2; }
    .face:nth-child(3) { z-index: 1; }
    .remove-face {
      position: absolute; top: -4px; right: -4px; width: 18px; height: 18px;
      border-radius: 50%; background: #ef4444; color: white; border: none;
      font-size: 0.75rem; display: flex; align-items: center; justify-content: center;
      cursor: pointer; opacity: 0; transition: opacity 0.2s;
    }
    .face:hover .remove-face { opacity: 1; }

    .invite-box {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: auto;
    }
    .invite-box input {
      padding: 0 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      width: 240px;
      transition: all 0.2s;
      background: #f8fafc;
      height: 42px;
    }
    .invite-box input:focus { border-color: #ea580c; background: white; outline: none; box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1); }
    .invite-box button {
      padding: 0 1.25rem;
      background: #ea580c;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s;
      height: 42px;
    }
    .invite-box button:hover:not(:disabled) { background: #c2410c; }
    .invite-box button:disabled { opacity: 0.5; cursor: not-allowed; }

    .header-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem 3rem;
      margin-top: 2rem;
      padding: 1.5rem 0 0 0;
      border-top: 1px solid #f1f5f9;
    }
    .header-stats.empty-stats { border-top: none; }
    .header-stats.empty-stats p { color: #94a3b8; font-style: italic; font-size: 0.95rem; margin: 0; }
    
    .stat-mini {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .sm-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .sm-val {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .sm-val small { font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
    .mini-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .mc { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.65rem; border-radius: 20px; white-space: nowrap; }
    .mc.easy { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .mc.med  { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .mc.hard { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
    .mc.cat { background: #f1f5f9; color: #475569; font-weight: 500; border: 1px solid #e2e8f0; }
    /* ── End Modern Header ──────────────────────────────────── */
    .ai-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 1rem;
      margin: 1rem 0 2rem;
      border-radius: 0 8px 8px 0;
      color: #92400e;
    }
    .btn-proceed {
      background: #f59e0b;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 1rem;
    }
    .btn-cancel {
      background: #e5e7eb;
      color: #374151;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .classifying-overlay {
      text-align: center;
      padding: 2rem;
      background: #f0fdf4;
      color: #166534;
      border-radius: 8px;
      margin-bottom: 2rem;
      font-weight: 600;
    }
    .recipes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }
    .recipe-wrapper {
      position: relative;
    }
    .btn-remove {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(220,38,38,0.9);
      color: white;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      z-index: 10;
    }
    .empty-state {
      text-align: center;
      padding: 4rem;
      background: #faf5eb;
      border-radius: 12px;
      color: #78716c;
    }
    .btn-explore {
      display: inline-block;
      margin-top: 1rem;
      background: #ea580c;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
    .confirm-modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .confirm-modal {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    .confirm-modal h3 {
      margin: 0 0 1rem 0;
      color: #1e293b;
      font-size: 1.5rem;
    }
    .confirm-modal p {
      color: #64748b;
      margin-bottom: 2rem;
      line-height: 1.5;
    }
    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    .modal-actions button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .modal-actions .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }
    .modal-actions .btn-cancel:hover {
      background: #e2e8f0;
    }
    @media (max-width: 600px) {
        .modal-actions {
          flex-direction: column;
        }
        .modal-actions button {
          width: 100%;
        }
      }
      .modal-actions .btn-delete {
      background: #ef4444;
      color: white;
    }
    .modal-actions .btn-delete:hover {
      background: #dc2626;
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
      z-index: 1001;
    }
    .toast-notification.show {
      bottom: 2rem;
    }

      @media (max-width: 1000px) and (min-width: 601px) {
        .header-top { flex-direction: column; gap: 1.5rem; align-items: flex-start !important; }
        .header-collab { align-items: flex-start !important; width: 100%; padding-top: 0; }
        .facepile { justify-content: flex-start !important; padding-left: 0 !important; }
        .invite-box { justify-content: flex-start !important; width: 100%; max-width: 100%; }
      }
      
      @media (max-width: 600px) {
        .modern-header { flex-direction: column; padding: 1.5rem; gap: 1.5rem; text-align: center; }
        .cover-wrapper { width: 100%; height: auto; aspect-ratio: 1; max-height: 400px; margin: 0 auto; }
        .header-top { flex-direction: column; align-items: center; gap: 1.5rem; width: 100%; }
        .header-top-left { display: flex; flex-direction: column; align-items: center; width: 100%; text-align: center; }
        .header-collab { align-items: center !important; width: 100%; display: flex; flex-direction: column; }
        .facepile { justify-content: center !important; padding-left: 0 !important; }
        .invite-box { justify-content: center !important; width: 100%; display: flex; max-width: 400px; margin: 0 auto; }
        .invite-box input { flex: 1; width: 100%; min-width: 0; text-align: center; }
        .col-title { font-size: 2.2rem; text-align: center; }
        .col-desc { text-align: center; }
        .action-buttons { margin-top: 0; padding-top: 0.5rem; justify-content: center; width: 100%; }
      }

  `]
})
export class CollectionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private collectionService = inject(CollectionService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  collection: Collection | null = null;
  isOwner = false;
  shareUrl = '';
  loading = true;

  // Collaborators
  newCollabEmail = '';
  isAddingCollab = false;
  public typeOf = (obj: any) => typeof obj;

  error: string | null = null;

  selectedFile: File | null = null;
  aiWarning = false;
  isClassifying = false;
  
  // Store mobilenet model in memory
  model: any;
  showConfirmModal = false;
  recipeToRemove: string | null = null;
  recipeToRemoveTitle = '';
  showCookbookConfirmModal = false;
  showToast = false;
  toastMessage = '';

  
  addCollaborator() {
    if (!this.newCollabEmail || !this.collection) return;
    this.isAddingCollab = true;
    this.collectionService.addCollaborator(this.collection._id, this.newCollabEmail).subscribe({
      next: (col: any) => {
        this.collection = col;
        this.newCollabEmail = '';
        this.isAddingCollab = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.message || 'Failed to add collaborator', 'Close', { duration: 3000 });
        this.isAddingCollab = false;
        this.cdr.detectChanges();
      }
    });
  }

  removeCollaborator(userId: string) {
    if (!this.collection || !confirm('Remove this collaborator?')) return;
    this.collectionService.removeCollaborator(this.collection._id, userId).subscribe({
      next: (col: any) => {
        this.collection = col;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.message || 'Failed to remove collaborator', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const shareToken = params.get('token');
      
      if (id) {
        this.loadCollection(id);
      } else if (shareToken) {
        this.loadSharedCollection(shareToken);
      }
    });
    
    // Preload MobileNet model
    this.loadAiModel();
  }
  
  async loadAiModel() {
    try {
      await tf.setBackend('cpu');
      await tf.ready();
      this.model = await mobilenet.load();
    } catch (e) {
      console.error('Error loading mobilenet', e);
    }
  }

  loadCollection(id: string) {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
    this.collectionService.getCollectionById(id).subscribe({
      next: (col: any) => {
        this.collection = col;
        const currentUser = this.authService.currentUserValue;
          this.isOwner = !!currentUser && (col.user?._id === currentUser._id || col.user === currentUser._id); 
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/collections']);
      }
    });
  }

  loadSharedCollection(token: string) {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
    this.collectionService.getSharedCollection(token).subscribe({
      next: (col: any) => {
        this.collection = col;
        this.isOwner = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      }
    });
  }

  confirmRemove(recipeId: string) {
    this.recipeToRemove = recipeId;
    const recipe = this.collection?.recipes.find(r => r._id === recipeId);
    this.recipeToRemoveTitle = recipe ? recipe.title : 'this recipe';
    this.showConfirmModal = true;
    this.cdr.detectChanges();
  }
  cancelRemove() {
    this.showConfirmModal = false;
    this.recipeToRemove = null;
    this.cdr.detectChanges();
  }
  executeRemove() {
    if (!this.collection || !this.recipeToRemove) return;
    const id = this.recipeToRemove;
    this.collectionService.removeRecipeFromCollection(this.collection._id, id).subscribe({
      next: () => {
        this.collection!.recipes = this.collection!.recipes.filter(r => r._id !== id);
        this.showConfirmModal = false;
        this.recipeToRemove = null;
    this.cdr.detectChanges();
        this.showToastNotification('Recipe removed from cookbook.');
        this.cdr.detectChanges();
      }
    });
  }
  confirmDeleteCookbook() {
    this.showCookbookConfirmModal = true;
    this.cdr.detectChanges();
  }
  cancelDeleteCookbook() {
    this.showCookbookConfirmModal = false;
    this.cdr.detectChanges();
  }
  executeDeleteCookbook() {
    if (!this.collection) return;
    this.collectionService.deleteCollection(this.collection._id).subscribe({
      next: () => {
        this.router.navigate(['/collections']);
      }
    });
  }
  showToastNotification(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
  shareCollection() {
    if (!this.collection) return;
    if (!this.collection.isPublic || !this.collection.shareToken) {
      // make it public
      this.collectionService.updateCollection(this.collection._id, { isPublic: true }).subscribe({
        next: (col: any) => {
          this.collection = col;
          this.generateLink();
        }
      });
    } else {
      this.generateLink();
    }
  }
  
  generateLink() {
    if (!this.collection?.shareToken) return;
    const origin = window.location.origin;
    this.shareUrl = `${origin}/collections/shared/${this.collection.shareToken}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.shareUrl).then(() => {
        this.snackBar.open('Share link copied to clipboard!', 'Close', { duration: 3000 });
      });
    } else {
      prompt('Copy this share link:', this.shareUrl);
    }
  }
  
  copyLink(input: HTMLInputElement) {
    input.select();
    document.execCommand('copy');
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    this.selectedFile = file;
    
    if (this.model) {
      this.isClassifying = true;
      this.aiWarning = false;
      
      try {
        // Create an image element to pass to mobilenet
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        
        img.onload = async () => {
          const predictions = await this.model.classify(img);
          this.isClassifying = false;
          
          // Check if it's food related. 
          // MobileNet has specific categories. Food is generally "food", "fruit", "vegetable", "meat", "dish", "plate", etc.
          // For simplicity, we just check if predictions contain any food keywords.
          const foodKeywords = ['food', 'fruit', 'vegetable', 'meat', 'dish', 'plate', 'bowl', 'cup', 'pizza', 'burger', 'sandwich', 'dessert', 'cake', 'bread', 'pasta', 'soup', 'salad'];
          
          let isFood = false;
          for (let p of predictions) {
            const classNames = p.className.toLowerCase();
            if (foodKeywords.some(kw => classNames.includes(kw))) {
              isFood = true;
              break;
            }
          }
          
          if (!isFood) {
            this.aiWarning = true; // trigger warning
          } else {
            this.proceedWithUpload();
          }
        };
      } catch (e) {
        this.isClassifying = false;
        this.proceedWithUpload(); // fallback
      }
    } else {
      this.proceedWithUpload(); // if model failed to load, just upload
    }
  }

  proceedWithUpload() {
    this.aiWarning = false;
    if (!this.selectedFile || !this.collection) return;
    
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    
    this.http.post<{imageUrl: string}>(`${environment.apiUrl}/upload/recipes`, formData).subscribe({
      next: (res) => {
        this.collectionService.updateCollection(this.collection!._id, { coverImage: res.imageUrl }).subscribe({
          next: (updatedCol: Collection) => {
            this.collection = updatedCol;
          }
        });
      }
    });
  }
  
  cancelUpload() {
    this.aiWarning = false;
    this.selectedFile = null;
  }

  // ── Analytics helpers ──────────────────────────────────────
  private recipes(): any[] { return (this.collection?.recipes || []) as any[]; }

  getAvgPrepTime(): number {
    const r = this.recipes().filter(r => r.prepTimeMinutes > 0);
    if (!r.length) return 0;
    return Math.round(r.reduce((s: number, r: any) => s + (r.prepTimeMinutes || 0), 0) / r.length);
  }

  getAvgCookTime(): number {
    const r = this.recipes().filter(r => r.cookTimeMinutes > 0);
    if (!r.length) return 0;
    return Math.round(r.reduce((s: number, r: any) => s + (r.cookTimeMinutes || 0), 0) / r.length);
  }

  getAvgTotalTime(): number {
    const r = this.recipes().filter(r => (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0) > 0);
    if (!r.length) return 0;
    return Math.round(r.reduce((s: number, r: any) => s + (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0), 0) / r.length);
  }

  getAvgIngredients(): number {
    const r = this.recipes().filter(r => r.ingredients?.length > 0);
    if (!r.length) return 0;
    return Math.round(r.reduce((s: number, r: any) => s + (r.ingredients?.length || 0), 0) / r.length);
  }

  getDifficultyCount(level: string): number {
    return this.recipes().filter(r => r.difficulty === level).length;
  }

  getTopCategories(): string[] {
    const counts: Record<string, number> = {};
    this.recipes().forEach((r: any) => {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, count]) => `${cat} (${count})`);
  }
  // ── End Analytics ─────────────────────────────────────────

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
