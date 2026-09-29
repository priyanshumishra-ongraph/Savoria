import express from 'express';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/favorite.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(protect, getFavorites);

router.route('/:recipeId')
  .post(protect, addFavorite)
  .delete(protect, removeFavorite);

export default router;
