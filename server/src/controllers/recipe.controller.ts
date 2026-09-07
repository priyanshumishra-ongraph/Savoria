import { Request, Response } from 'express';
import Recipe, { IRecipe, toSlug } from '../models/Recipe';
import { AuthRequest } from '../middleware/auth.middleware';

const serverError = (res: Response, error: unknown): void => {
  if (process.env.NODE_ENV !== 'production') {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  } else {
    res.status(500).json({ message: 'Server error' });
  }
};

const ALLOWED_RECIPE_FIELDS: (keyof IRecipe)[] = [
  'title', 'description', 'imageUrl', 'difficulty',
  'category', 'ingredients', 'steps', 'tags',
  'prepTimeMinutes', 'cookTimeMinutes',
];

export const getRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip  = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.search)   query.$text    = { $search: req.query.search as string };

    const recipes = await Recipe.find(query)
      .populate('owner', 'name email avatarUrl')
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
    serverError(res, error);
  }
};

export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('owner', 'name email avatarUrl');
    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }
    res.json(recipe);
  } catch (error) {
    serverError(res, error);
  }
};

export const getRecipeBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, titleSlug } = req.params;

    const recipe = await Recipe.findOne({
      slug: titleSlug,
      category: new RegExp(`^${category}$`, 'i'),
    }).populate('owner', 'name email avatarUrl');

    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }
    res.json(recipe);
  } catch (error) {
    serverError(res, error);
  }
};

export const getMyRecipes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip  = (page - 1) * limit;

    const query = { owner: req.user?.id };

    const recipes = await Recipe.find(query)
      .populate('owner', 'name email avatarUrl')
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
    serverError(res, error);
  }
};

export const createRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
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
    serverError(res, error);
  }
};

export const updateRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
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
    serverError(res, error);
  }
};

export const deleteRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
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
    serverError(res, error);
  }
};
