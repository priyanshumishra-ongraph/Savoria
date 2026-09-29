import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import Recipe from '../models/Recipe';
import Collection from '../models/Collection';

export const addFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }

    // Find or create "Favorites" collection for this user
    let favCollection = await Collection.findOne({ user: user._id, name: 'Favorites' });
    if (!favCollection) {
      favCollection = new Collection({
        name: 'Favorites',
        user: user._id,
        isPublic: false,
        recipes: []
      });
    }

    if (favCollection.recipes.includes(recipe._id as any)) {
      res.status(400).json({ message: 'Recipe already in favorites' });
      return;
    }

    favCollection.recipes.push(recipe._id as any);
    await favCollection.save();

    // Also keep user.favorites in sync just in case
    if (!user.favorites.includes(recipe._id as any)) {
      user.favorites.push(recipe._id as any);
      await user.save();
    }

    res.status(200).json({ message: 'Recipe added to favorites collection', favorites: user.favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const removeFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let favCollection = await Collection.findOne({ user: user._id, name: 'Favorites' });
    if (favCollection) {
      favCollection.recipes = favCollection.recipes.filter((id) => id.toString() !== req.params.recipeId);
      await favCollection.save();
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== req.params.recipeId);
    await user.save();

    res.status(200).json({ message: 'Recipe removed from favorites collection', favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
  
export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).populate('favorites');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
