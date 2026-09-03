export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
    createdAt?: string;
}

export interface AuthResponse extends User {
    token: string;
}

export interface Ingredient {
    name: string;
    quantity: string;
}

export interface Recipe {
    _id: string;
    title: string;
    description?: string;
    category: string;
    difficulty: string;
    owner: User;
    imageUrl?: string;
    ingredients: Ingredient[];
    steps: string[];
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    tags?: string[];
    likes?: string[];
    likesCount?: number;
}

export interface RecipeResponse{
    recipes: Recipe[];
    total: number;
}