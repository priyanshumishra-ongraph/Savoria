import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecipeService } from '../core/services/recipe.service';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule
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
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Difficulty</mat-label>
              <mat-select formControlName="difficulty">
                <mat-option value="Easy">Easy</mat-option>
                <mat-option value="Medium">Medium</mat-option>
                <mat-option value="Hard">Hard</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Prep Time (minutes)</mat-label>
              <input matInput type="number" formControlName="prepTimeMinutes" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Cook Time (minutes)</mat-label>
              <input matInput type="number" formControlName="cookTimeMinutes" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Image URL (Optional)</mat-label>
              <input matInput formControlName="imageUrl" placeholder="https://...">
            </mat-form-field>

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
          <button mat-flat-button class="btn-submit" [disabled]="recipeForm.invalid || isSubmitting" (click)="onSubmit()">
            <mat-spinner *ngIf="isSubmitting" diameter="20" class="btn-spinner"></mat-spinner>
            <span *ngIf="!isSubmitting">{{ isEditMode ? 'Save Changes' : 'Publish Recipe' }}</span>
          </button>
        </mat-card-actions>
      </mat-card>
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
  `]
})
export class RecipeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  recipeForm!: FormGroup;
  isSubmitting = false;
  error = '';
  isEditMode = false;
  recipeId: string | null = null;

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
    this.recipeService.getRecipeById(this.recipeId!).subscribe(recipe => {
      this.recipeForm.patchValue({
        ...recipe,
        ingredientsText: recipe.ingredients.map((i: any) => `${i.quantity} ${i.name}`).join(', '),
        stepsText: recipe.steps.join('\n'),
        tagsText: recipe.tags ? recipe.tags.join(', ') : ''
      });
    });
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
        const slug = savedRecipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        this.router.navigate(['/recipes', savedRecipe.category.toLowerCase(), slug]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to save recipe.';
      }
    });
  }
}
