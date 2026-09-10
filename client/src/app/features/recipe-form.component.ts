import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecipeService } from '../core/services/recipe.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule
  ],
  template: `
    <div class="form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Recipe' : 'Share a New Recipe' }}</mat-card-title>
          <mat-card-subtitle>{{ isEditMode ? 'Update your masterpiece' : 'Inspire others with your culinary creation!' }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="recipeForm" (ngSubmit)="onSubmit()" class="recipe-form">
            
            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Recipe Title</mat-label>
              <input matInput formControlName="title" placeholder="E.g., Creamy Garlic Pasta">
              <mat-error *ngIf="recipeForm.get('title')?.hasError('required')">Title is required</mat-error>
              <mat-error *ngIf="recipeForm.get('title')?.hasError('minlength')">Title must be at least 3 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option value="Breakfast">Breakfast</mat-option>
                <mat-option value="Lunch">Lunch</mat-option>
                <mat-option value="Dinner">Dinner</mat-option>
                <mat-option value="Dessert">Dessert</mat-option>
                <mat-option value="Beverage">Beverage</mat-option>
                <mat-option value="Snack">Snack</mat-option>
              </mat-select>
              <mat-error *ngIf="recipeForm.get('category')?.hasError('required')">Category is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Difficulty</mat-label>
              <mat-select formControlName="difficulty">
                <mat-option value="Easy">Easy</mat-option>
                <mat-option value="Medium">Medium</mat-option>
                <mat-option value="Hard">Hard</mat-option>
              </mat-select>
              <mat-error *ngIf="recipeForm.get('difficulty')?.hasError('required')">Difficulty is required</mat-error>
            </mat-form-field>


            <mat-form-field appearance="outline">
              <mat-label>Prep Time (minutes)</mat-label>
              <input matInput type="number" formControlName="prepTimeMinutes" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Cook Time (minutes)</mat-label>
              <input matInput type="number" formControlName="cookTimeMinutes" min="0">
            </mat-form-field>

            <div class="col-span-2 file-upload-container">
              <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display: none;">
              <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="isUploadingImage">
                <mat-icon>cloud_upload</mat-icon>
                {{ recipeForm.get('imageUrl')?.value ? 'Change Image' : 'Upload Image' }}
              </button>
              <mat-spinner *ngIf="isUploadingImage" diameter="24" class="inline-spinner"></mat-spinner>
              <div *ngIf="recipeForm.get('imageUrl')?.value && !isUploadingImage" class="image-preview">
                <img [src]="getImageUrl(recipeForm.get('imageUrl')?.value)" alt="Recipe Preview" height="100">
              </div>
            </div>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="2" placeholder="A brief description..."></textarea>
              <mat-hint align="end">{{recipeForm.get('description')?.value?.length || 0}}/300</mat-hint>
              <mat-error *ngIf="recipeForm.get('description')?.hasError('maxlength')">Max 300 characters</mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Ingredients (Comma separated)</mat-label>
              <textarea matInput formControlName="ingredientsText" rows="5" placeholder="2 cups flour, 1 tsp salt..."></textarea>
              <mat-error *ngIf="recipeForm.get('ingredientsText')?.hasError('required')">At least one ingredient is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Instructions (New line for each step)</mat-label>
              <textarea matInput formControlName="stepsText" rows="5" placeholder="1. Preheat oven..."></textarea>
              <mat-error *ngIf="recipeForm.get('stepsText')?.hasError('required')">At least one step is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Tags (Comma separated)</mat-label>
              <input matInput formControlName="tagsText" placeholder="vegan, healthy, quick">
            </mat-form-field>

          </form>

          <div *ngIf="error" class="error-banner">{{ error }}</div>
        </mat-card-content>

        <mat-card-actions class="actions">
          <button mat-button routerLink="/dashboard">Cancel</button>
          <button mat-flat-button class="btn-submit" [disabled]="recipeForm.invalid || isSubmitting || isUploadingImage" (click)="onSubmit()">
            <mat-spinner *ngIf="isSubmitting" diameter="20" class="btn-spinner"></mat-spinner>
            <span *ngIf="!isSubmitting">{{ isEditMode ? 'Save Changes' : 'Publish Recipe' }}</span>
          </button>
        </mat-card-actions>
      </mat-card>
      
      <!-- Success Modal -->
      <div class="modal-overlay" *ngIf="showSuccessPopup">
        <div class="modal-content text-center">
          <div class="success-badge">✓</div>
          <h3>Recipe Published!</h3>
          <p>Your recipe has been successfully {{ isEditMode ? 'updated' : 'created' }} and is now live.</p>
          <div class="modal-actions">
            <button mat-flat-button class="btn-submit popup-btn" (click)="viewRecipe()">
              View Recipe
            </button>
            <button mat-button class="popup-btn" (click)="closeSuccessPopup()">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-container { background-color: #faf5eb; min-height: calc(100vh - 70px); padding: 40px 20px; display: flex; justify-content: center; align-items: flex-start; }
    .form-card { width: 100%; max-width: 1200px; padding: 24px 32px; border-radius: 16px; background-color: #ffffff; box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.1), 0 8px 10px -6px rgba(249, 115, 22, 0.05); border: 1px solid #ffedd5; }
    mat-card-title { font-size: 32px; font-weight: 800; color: #ea580c; margin-bottom: 4px; }
    mat-card-subtitle { font-size: 16px; color: #7c2d12; margin-bottom: 24px; font-weight: 500; }
    .recipe-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .recipe-form mat-form-field { width: 100%; }
    .col-span-2 { grid-column: span 2; }
    .actions { display: flex; justify-content: flex-end; padding: 24px 0 0 0; gap: 12px; margin-top: 16px; border-top: 1px solid #ffedd5; }
    .actions button { border-radius: 8px !important; font-weight: 600; padding: 0 24px; height: 44px; }
    .btn-submit { 
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important; 
      color: white !important; 
    }
    .btn-submit:disabled {
      background: #fdba74 !important;
      color: #fffaf0 !important;
      opacity: 0.7;
    }
    .btn-spinner { margin-right: 8px; display: inline-block; }
    .error-banner { background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; margin-top: 16px; }
    
    .file-upload-container { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .inline-spinner { display: inline-block; margin-left: 12px; }
    .image-preview img { border-radius: 8px; border: 1px solid #ffedd5; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    /* Colored Form Fields */
    ::ng-deep .recipe-form .mdc-text-field--outlined {
      background-color: #fffaf0 !important;
    }
    ::ng-deep .recipe-form .mdc-notched-outline__leading,
    ::ng-deep .recipe-form .mdc-notched-outline__notch,
    ::ng-deep .recipe-form .mdc-notched-outline__trailing {
      border-color: #fed7aa !important;
    }
    ::ng-deep .recipe-form .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__leading,
    ::ng-deep .recipe-form .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__notch,
    ::ng-deep .recipe-form .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__trailing {
      border-color: #f97316 !important;
    }
    ::ng-deep .recipe-form .mdc-text-field--outlined.mdc-text-field--focused .mdc-notched-outline__leading,
    ::ng-deep .recipe-form .mdc-text-field--outlined.mdc-text-field--focused .mdc-notched-outline__notch,
    ::ng-deep .recipe-form .mdc-text-field--outlined.mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: #ea580c !important;
    }
    ::ng-deep .recipe-form .mat-mdc-form-field-focus-overlay {
      background-color: rgba(249, 115, 22, 0.03) !important;
    }
    ::ng-deep .recipe-form .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    ::ng-deep .recipe-form .mat-mdc-form-field.mat-form-field-invalid .mat-mdc-form-field-subscript-wrapper {
      display: flex;
    }

    @media (max-width: 768px) {
      .recipe-form { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: span 1; }
      .form-card { padding: 20px 16px; }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
      z-index: 1000; animation: fadeIn 0.2s;
    }
    .modal-content {
      background: white; border-radius: 20px; padding: 32px;
      width: calc(100% - 32px); max-width: 400px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: slideUp 0.3s ease;
      text-align: center;
    }
    .success-badge {
      width: 64px; height: 64px; background: #48bb78; color: white;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 32px; margin: 0 auto 16px;
    }
    .modal-content h3 { font-size: 24px; color: #1a202c; margin-bottom: 8px; font-weight: 700; }
    .modal-content p { color: #718096; margin-bottom: 24px; line-height: 1.5; }
    .modal-actions { display: flex; flex-direction: row; gap: 16px; justify-content: center; }
    .popup-btn { flex: 1; border-radius: 8px !important; }
    .full-width { width: 100%; box-sizing: border-box; }
    .mt-2 { margin-top: 8px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class RecipeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  recipeForm!: FormGroup;
  isSubmitting = false;
  isUploadingImage = false;
  error = '';
  isEditMode = false;
  recipeId: string | null = null;
  
  showSuccessPopup = false;
  createdRecipeSlug = '';
  createdRecipeCategory = '';

  ngOnInit() {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.recipeId;

    // Mirrors Mongoose Validation Constraints
    this.recipeForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      category: ['Dinner', Validators.required],
      difficulty: ['Medium', Validators.required],
      description: ['', Validators.maxLength(300)],
      imageUrl: [''],
      prepTimeMinutes: [null],
      cookTimeMinutes: [null],
      ingredientsText: ['', Validators.required],
      stepsText: ['', Validators.required],
      tagsText: ['']
    });

    if (this.isEditMode) {
      this.loadRecipeData();
    }
  }

  loadRecipeData() {
    this.recipeService.getRecipeById(this.recipeId!).subscribe({
      next: recipe => {
        this.recipeForm.patchValue({
          ...recipe,
          ingredientsText: recipe.ingredients.map((i: any) => `${i.quantity} ${i.name}`).join(', '),
          stepsText: recipe.steps.join('\n'),
          tagsText: recipe.tags ? recipe.tags.join(', ') : ''
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load recipe for editing. Please go back and try again.';
        this.recipeForm.disable(); // Prevent submitting an empty form
      }
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const title = this.recipeForm.get('title')?.value;
    if (file) {
      this.isUploadingImage = true;
      this.error = '';
      this.cdr.detectChanges();
      this.recipeService.uploadImage(file, title).subscribe({
        next: (res) => {
          this.recipeForm.patchValue({ imageUrl: res.imageUrl });
          this.isUploadingImage = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to upload image';
          this.isUploadingImage = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}${url}`;
  }

  onSubmit() {
    if (this.recipeForm.invalid) return;

    this.isSubmitting = true;
    this.error = '';

    const formVal = this.recipeForm.value;
    
    // Parse Text into backend Arrays
    const ingredientsArray = formVal.ingredientsText.split(',').map((i: string) => i.trim()).filter((i: string) => i).map((item: string) => {
      const match = item.match(/^((?:\d[\d\s\/\.\-]*|for garnish)?(?:\([^)]+\)\s*)?(?:(?:cups?|tbsp|tsp|oz|lbs?|g|ml|pinch|dash|cloves?|bunch|slices?|heads?)\b\s*)?)(.*)$/i);
      let qty = (match && match[1].trim()) ? match[1].trim() : '-';
      let name = match ? match[2].trim() : item;
      
      if (qty === '-' || qty === '') {
        const parts = item.split(' ');
        if (/^\d/.test(parts[0])) {
          qty = parts.shift() || '-';
          name = parts.join(' ');
        } else {
          qty = '-';
        }
      }
      return { quantity: qty, name: name || item };
    });

    const payload = {
      ...formVal,
      ingredients: ingredientsArray,
      steps: formVal.stepsText.split('\n').map((s: string) => s.trim()).filter((s: string) => s),
      tags: formVal.tagsText.split(',').map((t: string) => t.trim()).filter((t: string) => t)
    };

    const request$ = this.isEditMode 
      ? this.recipeService.updateRecipe(this.recipeId!, payload)
      : this.recipeService.createRecipe(payload);

    request$.subscribe({
      next: (savedRecipe: any) => {
        this.isSubmitting = false;
        this.createdRecipeSlug = savedRecipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        this.createdRecipeCategory = savedRecipe.category.toLowerCase();
        this.cdr.detectChanges(); // Update button state
        
        setTimeout(() => {
          this.showSuccessPopup = true;
          this.cdr.detectChanges();
        }, 1000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to save recipe.';
        this.cdr.detectChanges();
      }
    });
  }

  viewRecipe() {
    this.router.navigate(['/recipes', this.createdRecipeCategory, this.createdRecipeSlug]);
  }

  closeSuccessPopup() {
    this.showSuccessPopup = false;
    this.router.navigate(['/dashboard']);
  }
}
