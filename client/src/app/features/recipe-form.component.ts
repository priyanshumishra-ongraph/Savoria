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
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Recipe Title</mat-label>
              <input matInput formControlName="title" placeholder="E.g., Creamy Garlic Pasta">
              <mat-error *ngIf="recipeForm.get('title')?.hasError('required')">Title is required</mat-error>
              <mat-error *ngIf="recipeForm.get('title')?.hasError('minlength')">Title must be at least 3 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
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

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Difficulty</mat-label>
              <mat-select formControlName="difficulty">
                <mat-option value="Easy">Easy</mat-option>
                <mat-option value="Medium">Medium</mat-option>
                <mat-option value="Hard">Hard</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Prep Time (minutes)</mat-label>
              <input matInput type="number" formControlName="prepTimeMinutes" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Cook Time (minutes)</mat-label>
              <input matInput type="number" formControlName="cookTimeMinutes" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Image URL (Optional)</mat-label>
              <input matInput formControlName="imageUrl" placeholder="https://...">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="2" placeholder="A brief description..."></textarea>
              <mat-hint align="end">{{recipeForm.get('description')?.value?.length || 0}}/300</mat-hint>
              <mat-error *ngIf="recipeForm.get('description')?.hasError('maxlength')">Max 300 characters</mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Ingredients (Comma separated)</mat-label>
              <textarea matInput formControlName="ingredientsText" rows="3" placeholder="2 cups flour, 1 tsp salt..."></textarea>
              <mat-error *ngIf="recipeForm.get('ingredientsText')?.hasError('required')">At least one ingredient is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Instructions (New line for each step)</mat-label>
              <textarea matInput formControlName="stepsText" rows="4" placeholder="1. Preheat oven..."></textarea>
              <mat-error *ngIf="recipeForm.get('stepsText')?.hasError('required')">At least one step is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tags (Comma separated)</mat-label>
              <input matInput formControlName="tagsText" placeholder="vegan, healthy, quick">
            </mat-form-field>

          </form>

          <div *ngIf="error" class="error-banner">{{ error }}</div>
        </mat-card-content>

        <mat-card-actions class="actions">
          <button mat-button routerLink="/dashboard">Cancel</button>
          <button mat-flat-button color="accent" [disabled]="recipeForm.invalid || isSubmitting" (click)="onSubmit()">
            <mat-spinner *ngIf="isSubmitting" diameter="20" class="btn-spinner"></mat-spinner>
            <span *ngIf="!isSubmitting">{{ isEditMode ? 'Save Changes' : 'Publish Recipe' }}</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container { background-color: #faf5eb; min-height: calc(100vh - 70px); padding: 40px 20px; display: flex; justify-content: center; }
    .form-card { width: 100%; max-width: 900px; padding: 20px; border-radius: 16px; }
    mat-card-title { font-size: 28px; font-weight: 800; color: #3C2218; margin-bottom: 8px; }
    .recipe-form { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 24px; }
    .full-width { width: 100%; }
    .half-width { width: calc(50% - 8px); }
    .actions { display: flex; justify-content: flex-end; padding: 16px; gap: 12px; }
    .actions button { border-radius: 8px !important; }
    .btn-spinner { margin-right: 8px; display: inline-block; }
    .error-banner { background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; margin-top: 16px; }

    @media (max-width: 768px) {
      .half-width { width: 100%; }
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
      const parts = item.split(' ');
      return /^\d/.test(parts[0]) 
        ? { quantity: parts.shift(), name: parts.join(' ') } 
        : { quantity: '1', name: item };
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
        this.router.navigate(['/recipes', savedRecipe._id || this.recipeId]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to save recipe.';
      }
    });
  }
}
