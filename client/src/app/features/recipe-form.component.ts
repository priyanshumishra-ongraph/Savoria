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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PercentPipe } from '@angular/common';
import Tesseract from 'tesseract.js';
import { RecipeService } from '../core/services/recipe.service';
import { environment } from '../../environments/environment';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, MatProgressBarModule, PercentPipe
  ],
  template: `
    <div class="form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Recipe' : 'Share a New Recipe' }}</mat-card-title>
          <mat-card-subtitle>{{ isEditMode ? 'Update your masterpiece' : 'Inspire others with your culinary creation!' }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="snap-cook-banner col-span-2" *ngIf="!isEditMode">
              <div class="snap-cook-header">
                <div>
                  <h3 style="margin: 0; color: #ea580c; display: flex; align-items: center; gap: 8px;">
                    <mat-icon>document_scanner</mat-icon> Snap & Cook (AI Scanner)
                  </h3>
                  <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">Got an old recipe card? Snap a photo and let AI fill out the form for you!</p>
                </div>
                <button type="button" mat-stroked-button color="primary" (click)="fileInputOcr.click()" [disabled]="isScanningRecipe">
                  <mat-icon>camera_alt</mat-icon> Scan Photo
                </button>
                <input type="file" #fileInputOcr hidden (change)="onScanRecipe($event)" accept="image/*">
              </div>
              <div class="scan-progress" *ngIf="isScanningRecipe">
                <p style="margin-bottom: 8px; font-weight: 500; color: #3C2218;">Status: {{scanStatus}} ({{scanProgress | percent}})</p>
                <mat-progress-bar mode="determinate" [value]="scanProgress * 100"></mat-progress-bar>
              </div>
            </div>
            
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
              
                <mat-spinner *ngIf="isUploadingImage || isClassifying" diameter="24" class="inline-spinner"></mat-spinner>
                <span *ngIf="isClassifying" style="margin-left: 8px; color: #64748b; font-size: 14px;">Analyzing image...</span>
                
                <div *ngIf="aiWarning" class="ai-warning" style="margin-top: 12px; padding: 12px; background: #fffbeb; color: #b45309; border-radius: 8px; display: flex; align-items: center; gap: 8px; width: 100%;">
                  <mat-icon>warning</mat-icon>
                  <span><strong>AI Warning:</strong> This doesn't look like food! Are you sure you want to upload this image?</span>
                </div>

                <div *ngIf="recipeForm.get('imageUrl')?.value && !isUploadingImage && !isClassifying" class="image-preview" style="margin-top: 16px;">
  
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
              <mat-label>Ingredients (One per line)</mat-label>
              <textarea matInput formControlName="ingredientsText" rows="5" placeholder="2 cups flour\n1 tsp salt..."></textarea>
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
          <button mat-button routerLink="/discover">Cancel</button>
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
    .form-container { background-color: #faf5eb; min-height: calc(100vh - 70px); padding: 60px 20px; display: flex; justify-content: center; align-items: flex-start; }
    .form-card { 
      width: 100%; max-width: 900px; padding: 40px 48px; border-radius: 20px; background-color: #ffffff; 
      box-shadow: 0 10px 40px rgba(60, 34, 24, 0.05); border: 1px solid #d6d3d1; 
    }
    mat-card-title { font-family: 'Playfair Display', Georgia, serif; font-size: 38px; font-weight: 700; color: #3C2218; margin-bottom: 8px; }
    mat-card-subtitle { font-size: 16px; color: #78716c; margin-bottom: 32px; font-weight: 400; letter-spacing: 0.2px; }
    .recipe-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px; }
    .recipe-form mat-form-field { width: 100%; }
    .col-span-2 { grid-column: span 2; }
    .actions { display: flex; justify-content: flex-end; padding: 32px 0 0 0; gap: 16px; margin-top: 16px; border-top: 1px solid #d6d3d1; }
    .actions button { border-radius: 8px !important; font-weight: 600; padding: 0 24px; height: 44px; }
    .btn-submit { 
      background: #ea580c !important; 
      color: white !important; 
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
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
    .image-preview img { border-radius: 8px; border: 1px solid #d6d3d1; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    /* Colored Form Fields */
    ::ng-deep .recipe-form .mdc-text-field--outlined {
      background-color: #faf5eb !important;
    }
    ::ng-deep .recipe-form .mdc-notched-outline__leading,
    ::ng-deep .recipe-form .mdc-notched-outline__notch,
    ::ng-deep .recipe-form .mdc-notched-outline__trailing {
      border-color: #d6d3d1 !important; /* Visible warm stone border */
    }
    ::ng-deep .recipe-form .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__leading,
    ::ng-deep .recipe-form .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__notch,
    ::ng-deep .recipe-form .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__trailing {
      border-color: #ea580c !important; /* Terracotta hover */
    }
    ::ng-deep .recipe-form .mdc-text-field--outlined.mdc-text-field--focused .mdc-notched-outline__leading,
    ::ng-deep .recipe-form .mdc-text-field--outlined.mdc-text-field--focused .mdc-notched-outline__notch,
    ::ng-deep .recipe-form .mdc-text-field--outlined.mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: #3C2218 !important; /* Espresso focus */
      border-width: 2px !important;
    }
    ::ng-deep .recipe-form .mat-mdc-form-field-focus-overlay {
      background-color: transparent !important;
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

    /* Snap & Cook Styles */
    .snap-cook-banner {
      background: #fffdfa;
      border: 2px dashed #ea580c;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .snap-cook-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .scan-progress {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(249, 115, 22, 0.2);
    }
    
    @media (max-width: 768px) {
      .snap-cook-header { flex-direction: column; align-items: flex-start; gap: 12px; }
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
  private model: any;
  error = '';
  isEditMode = false;
  isClassifying = false;
  isScanningRecipe = false;
  scanProgress = 0;
  scanStatus = "";
  aiWarning = false;
  recipeId: string | null = null;
  
  showSuccessPopup = false;
  createdRecipeSlug = '';
  createdRecipeCategory = '';

  async loadAiModel() {
    try {
      await tf.setBackend('cpu');
      await tf.ready();
      this.model = await mobilenet.load();
    } catch (e) {
      console.error('Error loading mobilenet', e);
    }
  }

  ngOnInit() {
    this.loadAiModel();
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
          ingredientsText: recipe.ingredients.map((i: any) => `${i.quantity} ${i.name}`).join('\n'),
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

  async onScanRecipe(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isScanningRecipe = true;
    this.scanProgress = 0;
    this.scanStatus = 'Initializing AI...';
    this.cdr.detectChanges();

    try {
      const result = await Tesseract.recognize(URL.createObjectURL(file), 'eng', {
        logger: m => {
          this.scanStatus = m.status;
          this.scanProgress = m.progress;
          this.cdr.detectChanges();
        }
      });
      
      const text = result.data.text;
      this.parseScannedText(text);
      this.isScanningRecipe = false;
      this.cdr.detectChanges();
    } catch(err) {
      console.error(err);
      this.error = 'Failed to scan recipe image.';
      this.isScanningRecipe = false;
      this.cdr.detectChanges();
    }
  }

  parseScannedText(text: string) {
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    if(lines.length === 0) return;
    
    const title = lines[0] || 'Scanned Recipe';
    const ingredients: string[] = [];
    const steps: string[] = [];
    
    let mode = 'ingredients'; 
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();
      
      if (lower.includes('directions') || lower.includes('instructions') || lower.includes('steps') || lower.includes('method') || lower.includes('preparation')) {
        mode = 'steps';
        continue;
      }
      if (lower.includes('ingredients')) {
        mode = 'ingredients';
        continue;
      }
      
      if (mode === 'ingredients') {
        // If it starts with a number or contains common measurements, it's an ingredient
        if (/(?:^\d|^\d+\s*\/\s*\d+)/.test(line) || lower.includes('cup') || lower.includes('tbsp') || lower.includes('tsp') || lower.includes('oz') || lower.includes('g') || lower.includes('ml')) {
           ingredients.push(line);
        } else {
           // If it's a long sentence or ends with punctuation, it's likely a step
           if (line.length > 40 || /[.!?]$/.test(line)) {
              mode = 'steps';
              steps.push(line);
           } else {
              ingredients.push(line);
           }
        }
      } else {
        steps.push(line);
      }
    }
    
    // Ensure we don't end up with completely empty lists if parsing failed
    if (ingredients.length === 0 && steps.length === 0) {
      ingredients.push(...lines.slice(1));
    }
    
    this.recipeForm.patchValue({
      title: title.substring(0, 100),
      ingredientsText: ingredients.join('\n'),
      stepsText: steps.join('\n')
    });
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const title = this.recipeForm.get('title')?.value;
    if (!file) return;

    this.aiWarning = false;
    
    if (this.model) {
      this.isClassifying = true;
      this.cdr.detectChanges();
      
      try {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const predictions = await this.model.classify(img);
        this.isClassifying = false;
        
        const foodKeywords = ['food', 'fruit', 'vegetable', 'meat', 'dish', 'plate', 'bowl', 'cup', 'pizza', 'burger', 'sandwich', 'dessert', 'cake', 'bread', 'pasta', 'soup', 'salad', 'recipe', 'meal'];
        
        let isFood = false;
        for (let p of predictions) {
          const classNames = p.className.toLowerCase();
          if (foodKeywords.some(kw => classNames.includes(kw))) {
            isFood = true;
            break;
          }
        }
        
        if (!isFood) {
          this.aiWarning = true;
        }
      } catch(e) {
        console.error('Classification error', e);
        this.isClassifying = false;
      }
    }

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


  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}${path}`;
  }

  onSubmit() {
    if (this.recipeForm.invalid) return;

    this.isSubmitting = true;
    this.error = '';

    const formVal = this.recipeForm.value;
    
    // Parse Text into backend Arrays
    const ingredientsArray = formVal.ingredientsText.split('\n').map((i: string) => i.trim()).filter((i: string) => i).map((item: string) => {
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
    this.router.navigate(['/discover']);
  }
}
