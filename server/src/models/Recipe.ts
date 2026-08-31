import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
  name: string;
  quantity: string;
}

export interface IRecipe extends Document {
  owner: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  imageUrl?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: IIngredient[];
  steps: string[];
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Beverage' | 'Snack';
  tags: string[];
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
}

const RecipeSchema: Schema = new Schema(
  {
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
      maxlength: 300,
      trim: true
    },
    imageUrl: {
      type: String,
      default: 'placeholder-recipe.jpg'
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    ingredients: {
      type: [{
        name: { type: String, required: true },
        quantity: { type: String, required: true }
      }],
      validate: [
        (val: any[]) => val.length > 0,
        'A recipe must have at least one ingredient'
      ]
    },
    steps: {
      type: [String],
      validate: [
        (val: string[]) => val.length > 0,
        'A recipe must have at least one step'
      ]
    },
    category: {
      type: String,
      required: true,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Beverage', 'Snack']
    },
    tags: {
      type: [String],
      index: true
    },
    prepTimeMinutes: {
      type: Number,
      min: 0
    },
    cookTimeMinutes: {
      type: Number,
      min: 0
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    likesCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);


RecipeSchema.index({ 
  title: 'text', 
  'ingredients.name': 'text',
  tags: 'text',
  description: 'text'
});

export default mongoose.model<IRecipe>('Recipe', RecipeSchema);