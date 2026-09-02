import { Request, Response } from 'express';
import Recipe from '../models/Recipe';
import { AuthRequest } from '../middleware/auth.middleware';

export const getRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const query: any = {};
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }
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
      total
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
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
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const createRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newRecipe = new Recipe({
      ...req.body,
      owner: req.user?.id,
    });
    const savedRecipe = await newRecipe.save();
    res.status(201).json(savedRecipe);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
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
    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
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
    res.json({ message: 'Recipe removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
