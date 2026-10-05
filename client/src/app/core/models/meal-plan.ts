export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Beverage' | 'Dessert';

export interface MealPlanEntry {
    id: string;
    date: string; // ISO string like '2026-10-05'
    mealType: MealType;
    recipeId: string;
    targetServings: number;
    recipeName?: string; // Cache the name for display
    recipeBaseServings?: number;
}

export interface ShoppingListItem {
    id: string;
    name: string;
    totalQuantity: number;
    unit: string;
    isChecked: boolean;
}
