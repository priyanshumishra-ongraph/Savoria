import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
  name: string;
  quantity: string;
}

export interface IRecipe extends Document {
  owner: mongoose.Types.ObjectId;
  title: string;
  slug: string;
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
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: 300,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    ingredients: {
      type: [
        {
          name: { type: String, required: true },
          quantity: { type: String, required: true },
        },
      ],
      validate: {
        validator: (val: unknown[]) => val.length > 0,
        message: 'A recipe must have at least one ingredient',
      },
    },
    steps: {
      type: [String],
      validate: {
        validator: (val: string[]) => val.length > 0,
        message: 'A recipe must have at least one step',
      },
    },
    category: {
      type: String,
      required: true,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Beverage', 'Snack'],
      index: true,
    },
    tags: {
      type: [String],
      index: true,
    },
    prepTimeMinutes: {
      type: Number,
      min: 0,
    },
    cookTimeMinutes: {
      type: Number,
      min: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

RecipeSchema.virtual('likesCount').get(function (this: IRecipe) {
  return this.likes ? this.likes.length : 0;
});

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

RecipeSchema.pre<IRecipe>('save', function () {
  if (this.isModified('title') || !this.slug) {
    this.slug = toSlug(this.title);
  }
});

RecipeSchema.index({
  title: 'text',
  'ingredients.name': 'text',
  tags: 'text',
  description: 'text',
});

RecipeSchema.index({ category: 1, slug: 1 });

export { toSlug };
export default mongoose.model<IRecipe>('Recipe', RecipeSchema);