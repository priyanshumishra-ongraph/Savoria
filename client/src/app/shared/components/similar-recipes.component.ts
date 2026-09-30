import { Component, Input, OnChanges, inject, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RecipeCardComponent } from './recipe-card.component';
import { RecipeService } from '../../core/services/recipe.service';
import { EmbeddingService } from '../../core/services/embedding.service';
import { Recipe } from '../../core/models/types';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-similar-recipes',
  standalone: true,
  imports: [RecipeCardComponent, NgFor, NgIf],
  template: `
    <section class="similar-section" *ngIf="similar.length">
      <div class="similar-header">
        <h3>🤖 You might also like</h3>
        <p class="similar-sub">Found via semantic ingredient & flavour similarity</p>
      </div>
      <div class="similar-grid">
        <app-recipe-card *ngFor="let r of similar" [recipe]="r" />
      </div>
    </section>
  `,
  styles: [`
    .similar-section { margin-top: 40px; padding-top: 40px; border-top: 1px solid #e7e5e4; }
    .similar-header h3 { font-size: 24px; color: #3C2218; margin: 0 0 8px; font-family: 'Playfair Display', serif; }
    .similar-sub { margin: 0 0 24px; color: #78716c; font-size: 15px; }
    .similar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
  `]
})
export class SimilarRecipesComponent implements OnChanges {
  @Input({ required: true }) recipeId!: string;
  @Input() currentRecipeText = '';

  private recipeService    = inject(RecipeService);
  private embeddingService = inject(EmbeddingService);
  private cdr = inject(ChangeDetectorRef);
  
  similar: Recipe[] = [];

  constructor() {
    this.embeddingService.init();
  }

  async ngOnChanges() {
    if (!this.recipeId) return;

    try {
      // Step 1: Server-side fallback (fast)
      const res = await firstValueFrom(this.recipeService.getSimilar(this.recipeId));
      this.similar = res.recipes || [];
      this.cdr.detectChanges();

      // Step 2: Client-side embedding re-rank
      if (this.currentRecipeText && this.similar.length > 0) {
        const targetVec = await this.embeddingService.embedText(this.currentRecipeText);
        if (targetVec.length > 0) {
          const candidates = await Promise.all(
            this.similar.map(async r => ({
              id: r._id,
              vec: await this.embeddingService.embedText(
                `${r.title} ${r.ingredients?.map(i => i.name).join(' ')}`
              ),
            }))
          );
          const ranked = await this.embeddingService.rankSimilar(targetVec, candidates);
          if (ranked.length > 0) {
            const idOrder = ranked.map(r => r.id);
            this.similar = idOrder.map(id => this.similar.find(r => r._id === id)!).filter(Boolean);
            this.cdr.detectChanges();
          }
        }
      }
    } catch(err) {
      console.error('Error fetching similar recipes', err);
    }
  }
}

