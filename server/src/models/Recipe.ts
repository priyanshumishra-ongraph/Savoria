import mongoose, { Schema, Document } from 'mongoose';

export interface IIngredient extends Document {
    name: string;
    quantity: string;
}

export interface IRecipe extends Document { 
    owner: mongoose.Types.ObjectId;
    title: string;
    description: string;
    ingredients: IIngredient[];
    instructions: string;
    steps: string[];
    category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert' | 'Beverage';
    imageUrl?: string;
    prepTime: number; // in minutes
    cookTime: number; // in minutes
    servings: number;
    tags: string[];
}

const RecipeSchema: Schema<IRecipe> = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 500
    },
    ingredients: [{
        name: {
            type: String,
            required: true,
        },
        quantity: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 100
        }
    }],
    instructions: {
        type: String,
        required: true,
        trim: true,
        minlength: 10
    },
    steps: [{
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200
    }],
    category: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Beverage']
    },
    imageUrl: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)$/, 'Please fill a valid image URL']
    },
    prepTime: {
        type: Number,
        required: true,
        min: 1
    },
    cookTime: {
        type: Number,
        required: true,
        min: 1
    },
    servings: {
        type: Number,
        required: true,
        min: 1
    },
    tags: [{
        type: String,
        trim: true,
        minlength: 1,
        maxlength: 30
    }]
}, 
{
    timestamps: true
}
);

export default mongoose.model<IRecipe>('Recipe', RecipeSchema);