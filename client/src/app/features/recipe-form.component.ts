import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecipeService } from '../core/services/recipe.service';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner.component';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="form-container">
      <div class="form-card">
        <div class="form-header">
          <h2>Create New Recipe</h2>
          <p>Share your culinary masterpiece with the Savoria community.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #recipeForm="ngForm" class="recipe-form">
          <div class="input-group full-width">
            <label for="title">Recipe Title</label>
            <input type="text" id="title" [(ngModel)]="recipe.title" name="title" placeholder="e.g. Spicy Garlic Pasta" required>
          </div>

          <div class="input-group">
            <label for="category">Category</label>
            <select id="category" [(ngModel)]="recipe.category" name="category" required>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
              <option value="Snack">Snack</option>
            </select>
          </div>

          <div class="input-group">
            <label for="difficulty">Difficulty</label>
            <select id="difficulty" [(ngModel)]="recipe.difficulty" name="difficulty" required>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div class="input-group">
            <label for="prepTime">Prep Time (mins)</label>
            <input type="number" id="prepTime" [(ngModel)]="recipe.prepTimeMinutes" name="prepTimeMinutes" placeholder="15" min="0">
          </div>

          <div class="input-group">
            <label for="cookTime">Cook Time (mins)</label>
            <input type="number" id="cookTime" [(ngModel)]="recipe.cookTimeMinutes" name="cookTimeMinutes" placeholder="30" min="0">
          </div>

          <div class="input-group full-width">
            <label for="imageUrl">Image URL (Optional)</label>
            <input type="url" id="imageUrl" [(ngModel)]="recipe.imageUrl" name="imageUrl" placeholder="https://example.com/image.jpg">
          </div>

          <div class="input-group full-width">
            <label for="description">Description</label>
            <textarea id="description" [(ngModel)]="recipe.description" name="description" rows="3" placeholder="A brief description of this dish..." required></textarea>
          </div>
          
          <div class="input-group">
            <label for="ingredients">Ingredients (Comma separated)</label>
            <textarea id="ingredients" [(ngModel)]="ingredientsText" name="ingredients" rows="4" placeholder="2 cups flour, 1 tsp salt, 3 eggs..." required></textarea>
          </div>

          <div class="input-group">
            <label for="steps">Instructions (New line for each step)</label>
            <textarea id="steps" [(ngModel)]="stepsText" name="steps" rows="4" placeholder="1. Preheat oven...&#10;2. Mix ingredients..." required></textarea>
          </div>
          
          <div class="input-group full-width">
            <label for="tags">Tags (Comma separated)</label>
            <input type="text" id="tags" [(ngModel)]="tagsText" name="tags" placeholder="vegan, healthy, quick">
          </div>

          <div class="actions full-width">
            <a routerLink="/recipes" class="cancel-btn">Cancel</a>
            <button type="submit" class="submit-btn" [disabled]="!recipeForm.form.valid || isSubmitting">
              <span *ngIf="!isSubmitting">Publish Recipe</span>
              <app-loading-spinner *ngIf="isSubmitting"></app-loading-spinner>
            </button>
          </div>
        </form>

        <div *ngIf="error" class="error-banner">
          <span>{{ error }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      background-color: #f8f9fa;
      min-height: calc(100vh - 70px);
      font-family: 'Inter', 'Segoe UI', sans-serif;
      padding: 40px 0;
    }
    
    .form-card {
      background: #ffffff;
      padding: 50px 60px;
      border-radius: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.03);
      border: 1px solid #edf2f7;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .form-header {
      text-align: left;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #edf2f7;
    }

    .form-header h2 {
      margin: 0;
      color: #1a202c;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .form-header p {
      color: #718096;
      margin-top: 8px;
      font-size: 16px;
    }

    .recipe-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-group label {
      font-size: 14px;
      font-weight: 600;
      color: #34495e;
    }

    .input-group input, .input-group select, .input-group textarea {
      padding: 12px 16px;
      border: 1px solid #dfe6e9;
      border-radius: 8px;
      font-size: 15px;
      font-family: inherit;
      transition: all 0.3s ease;
      outline: none;
    }

    .input-group input:focus, .input-group select:focus, .input-group textarea:focus {
      border-color: #e67e22;
      box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 15px;
      margin-top: 20px;
    }

    .cancel-btn {
      color: #7f8c8d;
      text-decoration: none;
      font-weight: 600;
    }

    .cancel-btn:hover {
      color: #34495e;
    }

    .submit-btn {
      background-color: #e67e22;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .submit-btn:hover:not([disabled]) {
      background-color: #d35400;
    }

    .submit-btn[disabled] {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }

    .error-banner {
      margin-top: 25px;
      padding: 12px 15px;
      background-color: #fdeaea;
      color: #c0392b;
      border-left: 4px solid #e74c3c;
      border-radius: 4px;
    }

    @media (max-width: 992px) {
      .form-container {
        padding: 20px 10px;
      }
      .form-card {
        padding: 30px 20px;
      }
      .recipe-form {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RecipeFormComponent {
  recipe = {
    title: '',
    category: 'Dinner',
    difficulty: 'Medium',
    description: '',
    imageUrl: '',
    prepTimeMinutes: null,
    cookTimeMinutes: null
  };
  
  ingredientsText = '';
  stepsText = '';
  tagsText = '';
  
  error = '';
  isSubmitting = false;

  private recipeService = inject(RecipeService);
  private router = inject(Router);

  onSubmit() {
    this.isSubmitting = true;
    this.error = '';

    // Transform textareas into arrays that match the backend Mongoose schema
    const ingredientsArray = this.ingredientsText
      .split(',')
      .map(i => i.trim())
      .filter(i => i)
      .map(item => {
        // Simple heuristic: if the first word is a number (e.g. "2 cups flour"), use first two words as quantity?
        // Let's just take the first word as quantity if there are multiple words, else default to '1'.
        const parts = item.split(' ');
        if (parts.length > 1 && /^\d/.test(parts[0])) {
           // if it starts with a number, maybe grab first word or first two words (like "1/2 cup")
           let qty = parts.shift() || '1';
           if (parts.length > 0 && ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'g', 'kg', 'lb', 'lbs', 'ml', 'l', 'slice', 'slices'].includes(parts[0].toLowerCase())) {
             qty += ' ' + parts.shift();
           }
           return { name: parts.join(' '), quantity: qty };
        }
        return { name: item, quantity: '1' };
      });

    const stepsArray = this.stepsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s);
      
    const tagsArray = this.tagsText
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    const payload = {
      ...this.recipe,
      ingredients: ingredientsArray,
      steps: stepsArray,
      tags: tagsArray
    };

    this.recipeService.createRecipe(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/recipes']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to create recipe. Make sure all fields are valid.';
      }
    });
  }
}
