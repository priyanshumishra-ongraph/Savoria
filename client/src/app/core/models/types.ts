export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
  favorites?: string[];
    isActive?: boolean;
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
    averageRating?: number;
    reviewCount?: number;
    ratingDistribution?: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

export interface RecipeResponse{
    recipes: Recipe[];
    total: number;
    page?: number;
    pages?: number;
}

export interface Review {
    _id: string;
    recipeId: string;
    userId: User; // Populated user
    rating: number;
    comment: string;
    sentiment?: string;
    helpfulVotes?: string[];
    ownerReply?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Collection {
    _id: string;
    name: string;
    user: string | User;
    recipes: Recipe[];
    collaborators?: User[];
    coverImage?: string;
    isPublic: boolean;
    shareToken?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CollectionResponse {
    collections: Collection[];
    total: number;
    page: number;
    pages: number;
}
