import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MealPlanEntry, ShoppingListItem } from '../models/meal-plan';
import { Recipe } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class MealPlannerService {
  private readonly STORAGE_KEY = 'savoria_meal_plan';
  
  private mealPlanSubject = new BehaviorSubject<MealPlanEntry[]>(this.loadFromStorage());
  public mealPlan$ = this.mealPlanSubject.asObservable();

  constructor() {}

  private loadFromStorage(): MealPlanEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(plan: MealPlanEntry[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plan));
    this.mealPlanSubject.next(plan);
  }

  public getPlanForWeek(startDate: string, endDate: string): MealPlanEntry[] {
    return this.mealPlanSubject.value.filter(entry => 
      entry.date >= startDate && entry.date <= endDate
    );
  }

  public addMeal(entry: MealPlanEntry): void {
    const current = this.mealPlanSubject.value;
    this.saveToStorage([...current, entry]);
  }

  public removeMeal(id: string): void {
    const current = this.mealPlanSubject.value.filter(e => e.id !== id);
    this.saveToStorage(current);
  }

  /**
   * Advanced Aggregation Skill: Groups, merges, normalizes units, and converts large quantities.
   */
  public generateShoppingList(recipesInPlan: { entry: MealPlanEntry, recipe: Recipe }[]): ShoppingListItem[] {
    const aggregated = new Map<string, { totalQty: number, unit: string, name: string }>();

    recipesInPlan.forEach(({ entry, recipe }) => {
      const baseServings = entry.recipeBaseServings || 2;
      const scaleFactor = entry.targetServings / baseServings;

      recipe.ingredients.forEach(ingredient => {
        const { num, unit, name } = this.parseAdvancedQuantity(ingredient.quantity, ingredient.name);
        const scaledQty = num !== null ? num * scaleFactor : 0;
        
        // Normalize the item key so "Milk" and "milk" merge
        const key = `${name.toLowerCase()}`;

        if (aggregated.has(key)) {
          const existing = aggregated.get(key)!;
          // Simple unit normalization (e.g. merging cups and ml if we wanted, but we'll stick to matching units or converting to a base unit)
          const { convertedQty, finalUnit } = this.normalizeUnits(existing.totalQty, existing.unit, scaledQty, unit);
          existing.totalQty = convertedQty;
          existing.unit = finalUnit;
        } else {
          aggregated.set(key, { totalQty: scaledQty, unit, name });
        }
      });
    });

    return Array.from(aggregated.values()).map(item => ({
      id: Math.random().toString(36).substring(2, 9),
      name: item.name,
      totalQuantity: item.totalQty,
      unit: item.unit,
      isChecked: false
    }));
  }

  /**
   * Smart parser that extracts numbers, standardizes units (tbsp, tsp, cups, g, kg, ml, l), and extracts the clean name.
   */
  private parseAdvancedQuantity(rawQty: string, rawName: string): { num: number | null, unit: string, name: string } {
    if (!rawQty) return { num: 1, unit: '', name: rawName };

    let num: number | null = null;
    let unit = '';
    
    // Attempt to extract the leading number or range (e.g., "1", "1.5", "1/2", "1 1/2", "1-2")
    const numMatch = rawQty.match(/^([\d.\/\s\-]+)/);
    if (numMatch) {
      let numStr = numMatch[1].trim();
      
      // If it's a range like "1-2", just take the first number.
      if (numStr.includes('-')) {
        numStr = numStr.split('-')[0].trim();
      }

      if (numStr.includes('/')) {
        // Handle "1 1/2" or "1/2"
        const parts = numStr.split(' ').filter(p => p);
        if (parts.length === 2) {
          num = parseFloat(parts[0]) + this.evalFraction(parts[1]);
        } else {
          num = this.evalFraction(parts[0]);
        }
      } else {
        num = parseFloat(numStr);
      }
    }

    if (num === null || isNaN(num)) {
      num = 1; // Default to 1 if no number is found (e.g. "a pinch", "some", "to taste")
    }
    
    // Normalize common units
    const unitMap: { [key: string]: string } = {
      'g': 'g', 'gram': 'g', 'grams': 'g',
      'kg': 'kg', 'kilo': 'kg', 'kilogram': 'kg',
      'ml': 'ml', 'milliliter': 'ml', 'l': 'l', 'liter': 'l',
      'tbsp': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
      'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
      'cup': 'cup', 'cups': 'cup',
      'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
      'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb'
    };

    const words = rawQty.toLowerCase().split(/[^a-z]+/);
    for (const word of words) {
      if (unitMap[word]) {
        unit = unitMap[word];
        break;
      }
    }

    return { num, unit, name: rawName || rawQty };
  }

  private evalFraction(frac: string): number {
    const parts = frac.split('/');
    if (parts.length !== 2) return 0;
    return parseInt(parts[0]) / parseInt(parts[1]);
  }

  /**
   * Normalizes and merges two quantities that might be in compatible units (like g and kg).
   */
  private normalizeUnits(qty1: number, unit1: string, qty2: number, unit2: string): { convertedQty: number, finalUnit: string } {
    // Basic weight conversion
    if ((unit1 === 'g' || unit1 === 'kg') && (unit2 === 'g' || unit2 === 'kg')) {
      const totalGrams = (unit1 === 'kg' ? qty1 * 1000 : qty1) + (unit2 === 'kg' ? qty2 * 1000 : qty2);
      return totalGrams >= 1000 ? { convertedQty: totalGrams / 1000, finalUnit: 'kg' } : { convertedQty: totalGrams, finalUnit: 'g' };
    }
    
    // Basic volume conversion
    if ((unit1 === 'ml' || unit1 === 'l') && (unit2 === 'ml' || unit2 === 'l')) {
      const totalMl = (unit1 === 'l' ? qty1 * 1000 : qty1) + (unit2 === 'l' ? qty2 * 1000 : qty2);
      return totalMl >= 1000 ? { convertedQty: totalMl / 1000, finalUnit: 'L' } : { convertedQty: totalMl, finalUnit: 'ml' };
    }

    // Default fallback: just add them if units match exactly, otherwise keep unit1 (naive merge)
    return { convertedQty: qty1 + qty2, finalUnit: unit1 };
  }
}
