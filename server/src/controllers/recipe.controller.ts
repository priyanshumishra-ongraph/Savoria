import { Request, Response, NextFunction } from 'express';
import Recipe, { IRecipe, toSlug } from '../models/Recipe';
import { AuthRequest } from '../middleware/auth.middleware';



const ALLOWED_RECIPE_FIELDS: (keyof IRecipe)[] = [
  'title', 'description', 'imageUrl', 'difficulty',
  'category', 'ingredients', 'steps', 'tags',
  'prepTimeMinutes', 'cookTimeMinutes',
];

export const getRecipes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const skip  = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (req.query.search)   query.$text    = { $search: req.query.search as string };

    if (req.query.category) {
      query.category = { $in: (req.query.category as string).split(',').map(s => s.trim()) };
    }
    
    if (req.query.difficulty) {
      query.difficulty = { $in: (req.query.difficulty as string).split(',').map(s => s.trim()) };
    }
    
    if (req.query.tags) {
      query.tags = { $in: (req.query.tags as string).split(',').map(s => s.trim()) };
    }

    if (req.query.ingredients) {
      const names = (req.query.ingredients as string).split(',').map(s => s.trim()).filter(Boolean);
      if (names.length) {
        const regexNames = names.map(n => new RegExp(n, 'i'));
        if (req.query.strictIngredients === 'true') {
          query['ingredients.name'] = { $all: regexNames };
        } else {
          query['ingredients.name'] = { $in: regexNames };
        }
      }
    }

    if (req.query.maxCookTime) {
      const max = parseInt(req.query.maxCookTime as string);
      if (!isNaN(max)) query.cookTimeMinutes = { $lte: max };
    }

    if (req.query.minRating) {
      const min = parseFloat(req.query.minRating as string);
      if (!isNaN(min)) query.averageRating = { $gte: min };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:       { createdAt: -1 },
      rating:       { averageRating: -1, reviewCount: -1 },
      cookTime:     { cookTimeMinutes: 1 },
      mostReviewed: { reviewCount: -1 },
    };
    const sortKey = (req.query.sort as string) || 'newest';
    const sort = sortMap[sortKey] ?? sortMap['newest'];

    const recipes = await Recipe.find(query)
      .populate('owner', 'name avatarUrl')
      .skip(skip)
      .limit(limit)
      .sort(sort as any);

    const total = await Recipe.countDocuments(query);

    res.json({ recipes, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

export const getTrendingRecipes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await Recipe.find({
      updatedAt: { $gte: oneWeekAgo },
      reviewCount: { $gt: 0 },
    })
      .populate('owner', 'name avatarUrl')
      .sort({ reviewCount: -1, averageRating: -1 })
      .limit(8);

    res.json({ recipes: trending });
  } catch (error) {
    next(error);
  }
};

export const getSimilarRecipes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recipe = await Recipe.findById(req.params.id).lean();
    if (!recipe) { res.status(404).json({ message: 'Recipe not found' }); return; }

    const similar = await Recipe.find({
      _id: { $ne: recipe._id },
      $or: [
        { category: recipe.category },
        { tags: { $in: recipe.tags ?? [] } },
      ],
    })
      .populate('owner', 'name avatarUrl')
      .sort({ averageRating: -1 })
      .limit(6)
      .lean();

    res.json({ recipes: similar });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedRecipes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      // Fallback if not logged in
      const fallback = await Recipe.find({ averageRating: { $gte: 4 } }).sort({ reviewCount: -1 }).limit(6).populate('owner', 'name avatarUrl');
      res.json({ recipes: fallback });
      return;
    }

    const User = require('../models/User').default;
    const Review = require('../models/Review').default;

    const user = await User.findById(userId).populate('favorites');
    const highRatedReviews = await Review.find({ userId, rating: { $gte: 4 } });
    const reviewedRecipeIds = highRatedReviews.map((r: any) => r.recipeId);
    
    const favoriteIds = user?.favorites?.map((f: any) => f._id) || [];
    const sourceIds = [...favoriteIds, ...reviewedRecipeIds];

    if (sourceIds.length === 0) {
      // No history, return highest rated
      const fallback = await Recipe.find({ averageRating: { $gte: 4 } }).sort({ reviewCount: -1 }).limit(6).populate('owner', 'name avatarUrl');
      res.json({ recipes: fallback });
      return;
    }

    const sourceRecipes = await Recipe.find({ _id: { $in: sourceIds } });
    
    // Extract common tags and categories
    const categoryCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    
    sourceRecipes.forEach((r: any) => {
      if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      r.tags?.forEach((t: string) => tagCounts[t] = (tagCounts[t] || 0) + 1);
    });

    const topCategory = Object.keys(categoryCounts).sort((a,b) => categoryCounts[b] - categoryCounts[a])[0];
    const topTags = Object.keys(tagCounts).sort((a,b) => tagCounts[b] - tagCounts[a]).slice(0, 3);

    // Find recipes matching top category or tags, EXCLUDING ones they already fav'd/reviewed
    const recommended = await Recipe.find({
      _id: { $nin: sourceIds },
      $or: [
        { category: topCategory as any },
        { tags: { $in: topTags } }
      ]
    })
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(8)
    .populate('owner', 'name avatarUrl');

    // If still not enough, pad with top rated
    if (recommended.length < 4) {
      const padding = await Recipe.find({ _id: { $nin: [...sourceIds, ...recommended.map(r => r._id)] } })
        .sort({ averageRating: -1 })
        .limit(8 - recommended.length)
        .populate('owner', 'name avatarUrl');
      recommended.push(...padding);
    }

    res.json({ recipes: recommended });
  } catch (error) {
    next(error);
  }
};

export const getRecipeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('owner', 'name avatarUrl');
    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }
    res.json(recipe);
  } catch (error) {
    next(error);
  }
};

export const getRecipeBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, titleSlug } = req.params;

    // Escape regex special characters in the category string
    const safeCategory = String(category).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    const recipe = await Recipe.findOne({
      slug: titleSlug,
      category: new RegExp(`^${safeCategory}$`, 'i'),
    }).populate('owner', 'name avatarUrl');

    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }
    res.json(recipe);
  } catch (error) {
    next(error);
  }
};

export const getMyRecipes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip  = (page - 1) * limit;

    const query = { owner: req.user?.id };

    const recipes = await Recipe.find(query)
      .populate('owner', 'name avatarUrl')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Recipe.countDocuments(query);
    res.json({
      recipes,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const createRecipe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const safeBody: Partial<IRecipe> = {};
    for (const field of ALLOWED_RECIPE_FIELDS) {
      if (req.body[field] !== undefined) {
        (safeBody as Record<string, unknown>)[field] = req.body[field];
      }
    }

    const newRecipe = new Recipe({
      ...safeBody,
      owner: req.user?.id,
    });

    const savedRecipe = await newRecipe.save();
    res.status(201).json(savedRecipe);
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }
    if (recipe.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    for (const field of ALLOWED_RECIPE_FIELDS) {
      if (req.body[field] !== undefined) {
        (recipe as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    const updatedRecipe = await recipe.save();
    res.json(updatedRecipe);
  } catch (error) {
    next(error);
  }
};

export const deleteRecipe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }
    if (recipe.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await recipe.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
