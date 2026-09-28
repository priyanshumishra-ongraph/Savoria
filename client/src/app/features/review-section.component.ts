import { Component, Input, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService } from '../core/services/review.service';
import { AuthService } from '../core/services/auth.service';
import { Review } from '../core/models/types';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationModalComponent } from '../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-review-section',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule, ConfirmationModalComponent],
  template: `
    <div class="reviews-container" ngSkipHydration>
      <h3>Reviews & Ratings</h3>
      
      <!-- Rating Distribution Histogram -->
      <div class="rating-summary" *ngIf="reviews.length > 0">
        <div class="rating-average">
          <h2>{{ averageRating }}</h2>
          <div class="stars">
            <mat-icon *ngFor="let star of [1,2,3,4,5]" [class.active]="star <= averageRating">star</mat-icon>
          </div>
          <p>{{ reviews.length }} global ratings</p>
        </div>
        <div class="rating-histogram">
          <div class="hist-row" *ngFor="let star of [5,4,3,2,1]">
            <span class="hist-label">{{ star }} star</span>
            <div class="hist-bar">
              <div class="hist-fill" [style.width]="getPercent(star) + '%'"></div>
            </div>
            <span class="hist-pct">{{ getPercent(star) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- Write a Review Form -->
      <div class="write-review" *ngIf="isLoggedIn && !userHasReviewed">
        <h4>Write a Review</h4>
        <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
          <div class="star-rating">
            <mat-icon 
              *ngFor="let star of [1,2,3,4,5]" 
              (click)="setRating(star)"
              (mouseenter)="hoverRating = star"
              (mouseleave)="hoverRating = 0"
              [class.active]="star <= (hoverRating || currentRating)">
              star
            </mat-icon>
          </div>
          
          <div class="comment-wrapper">
            <textarea formControlName="comment" placeholder="What did you think of this recipe?" rows="4" (input)="onCommentInput()"></textarea>
            <div class="sentiment-preview" *ngIf="currentSentiment">
              <span class="badge" [ngClass]="currentSentiment.toLowerCase()">
                {{ currentSentiment }}
              </span>
            </div>
          </div>
          
          <div *ngIf="isToxic" class="toxicity-warning">
            <mat-icon>warning</mat-icon> Your review has been flagged for toxic content. Please keep feedback respectful.
          </div>
          
          <button type="submit" class="submit-btn" [disabled]="reviewForm.invalid || isSubmitting || isToxic">
            {{ isSubmitting ? 'Submitting...' : 'Post Review' }}
          </button>
          
          <div *ngIf="aiStatus === 'loading'" class="ai-loading-text" style="font-size: 11px; color: #a8a29e; margin-top: 8px; text-align: right;">
            AI engines warming up...
          </div>
        </form>
      </div>

      <div class="write-review login-prompt" *ngIf="!isLoggedIn">
        <p>Please log in to leave a review.</p>
      </div>

      <div class="write-review login-prompt" *ngIf="userHasReviewed">
        <p>You have already reviewed this recipe. Thank you!</p>
      </div>

      <!-- Sort Controls -->
      <div class="sort-controls" *ngIf="reviews.length > 0">
        <label for="sort-select">Sort by:</label>
        <select id="sort-select" [(ngModel)]="currentSort" (change)="loadReviews()">
          <option value="newest">Newest</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list">
        <div class="review-card" *ngFor="let review of reviews">
          <div class="review-header">
            <div class="user-info">
              <div class="avatar">{{ $any(review.userId)?.name?.charAt(0) || 'U' }}</div>
              <span class="name">{{ $any(review.userId)?.name || 'Unknown User' }}</span>
            </div>
            <div class="stars">
              <mat-icon *ngFor="let star of [1,2,3,4,5]" [class.active]="star <= review.rating">star</mat-icon>
            </div>
          </div>
          <div class="review-body">
            <p>{{ review.comment }}</p>
            <div class="review-footer">
              <span class="sentiment-badge" [ngClass]="review.sentiment?.toLowerCase() || 'neutral'">
                {{ review.sentiment || 'NEUTRAL' }}
              </span>
              <span class="date">{{ review.createdAt | date:'mediumDate' }}</span>
              
              <button class="helpful-btn" [class.active]="hasVotedHelpful(review)" (click)="toggleHelpful(review)">
                <mat-icon>thumb_up</mat-icon> Helpful ({{ review.helpfulVotes?.length || 0 }})
              </button>
              
              <button *ngIf="isRecipeOwner && !review.ownerReply" (click)="activeReplyId = review._id" class="reply-btn">
                <mat-icon>reply</mat-icon> Reply
              </button>
              
              <button *ngIf="canDelete(review)" (click)="deleteReview(review._id)" class="delete-btn">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            
            <!-- Owner Reply Input -->
            <div class="reply-input-wrapper" *ngIf="activeReplyId === review._id">
              <textarea [(ngModel)]="replyText" placeholder="Write a response as the chef..."></textarea>
              <div class="reply-actions">
                <button class="btn-cancel" (click)="activeReplyId = null">Cancel</button>
                <button class="btn-submit" (click)="submitOwnerReply(review)">Post Reply</button>
              </div>
            </div>
            
            <!-- Owner Reply Display -->
            <div class="owner-reply" *ngIf="review.ownerReply">
              <div class="owner-reply-header">
                <mat-icon>restaurant</mat-icon> <span>Chef's Response</span>
              </div>
              <p>{{ review.ownerReply }}</p>
            </div>
            
          </div>
        </div>
        <div *ngIf="reviews.length === 0" class="no-reviews">
          No reviews yet. Be the first to review!
        </div>
      </div>
      <app-confirmation-modal
        [isOpen]="isDeleteModalOpen"
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        (confirm)="confirmDelete()"
        (cancel)="cancelDelete()">
      </app-confirmation-modal>
    </div>
  `,
  styles: [`
    .reviews-container {
      margin-top: 40px;
      padding: 30px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }
    
    .rating-summary {
      display: flex;
      gap: 3rem;
      align-items: center;
      margin-bottom: 2rem;
      background: #faf5eb;
      padding: 1.5rem;
      border-radius: 12px;
      flex-wrap: wrap;
    }
    .rating-average {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .rating-average h2 {
      font-size: 3.5rem;
      line-height: 1;
      color: #3C2218;
      margin: 0 0 0.5rem 0;
    }
    .rating-average .stars {
      display: flex;
      gap: 2px;
      margin-bottom: 0.5rem;
    }
    .rating-average .stars mat-icon {
      color: #d6d3d1;
    }
    .rating-average .stars mat-icon.active {
      color: #ea580c;
    }
    .rating-histogram {
      flex: 1;
      min-width: 250px;
    }
    .hist-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }
    .hist-label {
      width: 45px;
      color: #3C2218;
      font-weight: 500;
    }
    .hist-bar {
      flex: 1;
      height: 12px;
      background: #e7e5e4;
      border-radius: 6px;
      overflow: hidden;
    }
    .hist-fill {
      height: 100%;
      background: #ea580c;
      border-radius: 6px;
      transition: width 0.3s ease;
    }
    .hist-pct {
      width: 35px;
      text-align: right;
      color: #78716c;
    }

    .sort-controls {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      color: #3C2218;
    }
    .sort-controls select {
      padding: 0.5rem;
      border-radius: 8px;
      border: 1px solid #d6d3d1;
      background: #fff;
      font-family: inherit;
      color: #3C2218;
    }
    
    .helpful-btn, .reply-btn {
      background: white;
      border: 1px solid #d6d3d1;
      border-radius: 6px;
      padding: 6px 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: #57534e;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      margin-left: 0.5rem;
    }
    .helpful-btn mat-icon, .reply-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .helpful-btn:hover, .reply-btn:hover {
      background: #faf5eb;
      color: #3C2218;
      border-color: #3C2218;
    }
    .helpful-btn.active {
      border-color: #ea580c;
      color: #ea580c;
      background: #fff3ed;
    }
    
    .reply-input-wrapper {
      margin-top: 1rem;
      background: #faf5eb;
      padding: 1rem;
      border-radius: 8px;
    }
    .reply-input-wrapper textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d6d3d1;
      border-radius: 4px;
      font-family: inherit;
      resize: vertical;
      min-height: 80px;
      margin-bottom: 0.5rem;
    }
    .reply-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
    .btn-cancel, .btn-submit {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-cancel {
      background: transparent;
      border: 1px solid #d6d3d1;
      color: #57534e;
    }
    .btn-cancel:hover {
      background: #f5f5f4;
      color: #1c1917;
    }
    .btn-submit {
      background: #ea580c;
      color: white;
      border: none;
    }
    .btn-submit:hover {
      background: #c2410c;
    }
    
    .owner-reply {
      margin-top: 1rem;
      background: #faf5eb;
      padding: 1.25rem;
      border-left: 4px solid #ea580c;
      border-radius: 8px;
    }
    .owner-reply-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #ea580c;
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .owner-reply-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .owner-reply p {
      margin: 0;
      font-size: 0.95rem;
      color: #3C2218;
      line-height: 1.5;
    }

    .toxicity-warning {
      color: #dc2626;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      background: #fef2f2;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.9rem;
      border: 1px solid #fecaca;
    }
    h3 {
      font-size: 28px;
      font-family: 'Playfair Display', serif;
      color: #3C2218;
      margin-bottom: 24px;
    }
    .ai-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #f97316;
      background: #fff7ed;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .spinner {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    
    .write-review {
      background: #fafaf9;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .write-review h4 {
      margin-top: 0;
      font-size: 18px;
      margin-bottom: 16px;
      color: #3C2218;
    }
    .star-rating {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
    }
    .star-rating mat-icon {
      color: #d6d3d1;
      cursor: pointer;
      font-size: 28px;
      width: 28px;
      height: 28px;
      transition: color 0.2s;
    }
    .star-rating mat-icon.active {
      color: #f59e0b;
    }
    .comment-wrapper {
      position: relative;
      margin-bottom: 16px;
    }
    textarea {
      width: 100%;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #d6d3d1;
      font-family: inherit;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    textarea:focus {
      border-color: #ea580c;
    }
    .sentiment-preview {
      position: absolute;
      bottom: 16px;
      right: 16px;
    }
    .badge, .sentiment-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 12px;
      text-transform: uppercase;
    }
    .positive { background: #dcfce7; color: #166534; }
    .negative { background: #fee2e2; color: #991b1b; }
    .neutral { background: #f3f4f6; color: #374151; }
    
    .submit-btn {
      background: #ea580c;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .login-prompt {
      text-align: center;
      color: #78716c;
    }
    
    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .review-card {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 20px;
    }
    .review-card:last-child {
      border-bottom: none;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      background: #f97316;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .name {
      font-weight: 600;
      color: #3C2218;
    }
    .stars mat-icon {
      color: #d6d3d1;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .stars mat-icon.active {
      color: #f59e0b;
    }
    .review-body p {
      color: #4b5563;
      margin-top: 0;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .review-footer {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .date {
      color: #9ca3af;
      font-size: 13px;
    }
    .delete-btn {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      margin-left: auto;
    }
    .no-reviews {
      text-align: center;
      color: #9ca3af;
      padding: 40px 0;
    }
  `]
})
export class ReviewSectionComponent implements OnInit, OnDestroy {
  @Input() recipeId!: string;
  @Input() recipeOwnerId!: string;

  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private snackBar = inject(MatSnackBar);

  reviews: Review[] = [];
  isLoggedIn = false;
  currentUserId: string | null = null;
  userHasReviewed = false;
  isRecipeOwner = false;
  
  isDeleteModalOpen = false;
  reviewToDelete: string | null = null;
  
  reviewForm: FormGroup;
  currentRating = 0;
  hoverRating = 0;
  isSubmitting = false;

  // UI State
  currentSort = 'newest';
  activeReplyId: string | null = null;
  replyText = '';
  averageRating = 0;
  ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // AI Web Worker
  private worker: Worker | null = null;
  aiStatus: 'loading' | 'ready' | 'error' | null = null;
  currentSentiment: string = '';
  isToxic: boolean = false;
  private debounceTimer: any;

  constructor() {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUserId = user?._id || null;
      this.isRecipeOwner = this.currentUserId === this.recipeOwnerId;
      this.checkUserReviewed();
    });

    this.loadReviews();

    if (isPlatformBrowser(this.platformId)) {
      this.initWebWorker();
    }
  }

  ngOnDestroy() {
    if (this.worker) {
      this.worker.terminate();
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  initWebWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../core/workers/sentiment.worker', import.meta.url), { type: 'module' });
      
      this.worker.onmessage = ({ data }) => {
        if (data.type === 'STATUS') {
          this.aiStatus = data.status;
          this.cdr.detectChanges();
        } else if (data.type === 'RESULT') {
          this.currentSentiment = data.result.label;
          this.isToxic = data.isToxic;
          this.cdr.detectChanges();
        }
      };

      this.worker.postMessage({ type: 'INIT' });

      // Fallback: Unblock the submit button if the massive AI download takes > 10s
      setTimeout(() => {
        if (this.aiStatus === 'loading') {
          this.aiStatus = 'ready';
          this.cdr.detectChanges();
        }
      }, 10000);
    }
  }

  onCommentInput() {
    const text = this.reviewForm.get('comment')?.value;
    if (!text || text.length < 5) {
      this.currentSentiment = '';
      this.isToxic = false;
      return;
    }
    
    if (this.worker && this.aiStatus === 'ready') {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.worker!.postMessage({ type: 'ANALYZE', text });
      }, 500);
    }
  }

  loadReviews() {
    this.reviewService.getReviewsForRecipe(this.recipeId, this.currentSort).subscribe({
      next: (res) => {
        this.reviews = res;
        this.calculateStats();
        this.checkUserReviewed();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load reviews', err)
    });
  }

  calculateStats() {
    if (this.reviews.length === 0) return;
    
    let sum = 0;
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    this.reviews.forEach(r => {
      sum += r.rating;
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating as keyof typeof dist]++;
      }
    });
    
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
    this.ratingDistribution = dist;
  }

  getPercent(star: number): number {
    if (this.reviews.length === 0) return 0;
    return Math.round((this.ratingDistribution[star] / this.reviews.length) * 100);
  }

  checkUserReviewed() {
    if (this.currentUserId && this.reviews.length > 0) {
      this.userHasReviewed = this.reviews.some(r => r.userId?._id === this.currentUserId);
    } else {
      this.userHasReviewed = false;
    }
  }

  setRating(rating: number) {
    this.currentRating = rating;
    this.reviewForm.patchValue({ rating });
  }

  submitReview() {
    if (this.reviewForm.invalid || this.isToxic) return;

    this.isSubmitting = true;
    const { rating, comment } = this.reviewForm.value;
    const sentiment = this.currentSentiment || 'NEUTRAL';

    this.reviewService.addReview(this.recipeId, rating, comment, sentiment).subscribe({
      next: (review) => {
        // We re-fetch to get correct ordering based on currentSort
        this.loadReviews();
        this.isSubmitting = false;
        this.snackBar.open('Review posted successfully', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.snackBar.open(err.error?.message || 'Failed to post review', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  hasVotedHelpful(review: Review): boolean {
    if (!this.currentUserId || !review.helpfulVotes) return false;
    return review.helpfulVotes.includes(this.currentUserId);
  }

  toggleHelpful(review: Review) {
    if (!this.isLoggedIn) {
      this.snackBar.open('Please log in to vote', 'Close', { duration: 3000 });
      return;
    }
    
    this.reviewService.toggleHelpful(review._id).subscribe({
      next: (updatedReview) => {
        const index = this.reviews.findIndex(r => r._id === updatedReview._id);
        if (index !== -1) {
          this.reviews[index] = updatedReview;
          this.cdr.detectChanges();
        }
      }
    });
  }

  submitOwnerReply(review: Review) {
    if (!this.replyText.trim()) return;
    
    this.reviewService.addOwnerReply(review._id, this.replyText).subscribe({
      next: (updatedReview) => {
        const index = this.reviews.findIndex(r => r._id === updatedReview._id);
        if (index !== -1) {
          this.reviews[index] = updatedReview;
          this.activeReplyId = null;
          this.replyText = '';
          this.snackBar.open('Reply posted!', 'Close', { duration: 3000 });
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to post reply', 'Close', { duration: 3000 });
      }
    });
  }

  canDelete(review: Review): boolean {
    if (!this.currentUserId) return false;
    return review.userId?._id === this.currentUserId || this.isRecipeOwner;
  }

  deleteReview(reviewId: string) {
    this.reviewToDelete = reviewId;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
    if (!this.reviewToDelete) return;
    
    this.reviewService.deleteReview(this.reviewToDelete).subscribe({
      next: () => {
        this.loadReviews();
        this.snackBar.open('Review deleted', 'Close', { duration: 3000 });
        this.isDeleteModalOpen = false;
        this.reviewToDelete = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete review', err);
        this.isDeleteModalOpen = false;
        this.reviewToDelete = null;
      }
    });
  }

  cancelDelete() {
    this.isDeleteModalOpen = false;
    this.reviewToDelete = null;
  }
}
