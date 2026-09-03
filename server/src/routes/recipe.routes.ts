import express from 'express';
import { 
  getRecipes, 
  getRecipeById, 
  createRecipe, 
  updateRecipe, 
  deleteRecipe,
  getMyRecipes
} from '../controllers/recipe.controller';
import { protect } from '../middleware/auth.middleware';
import { recipeRules, recipeIdRule, validate } from '../validators/recipe.validator';

const router = express.Router();

router.get('/', getRecipes);
router.get('/my', protect, getMyRecipes);
router.get('/:id', recipeIdRule, validate, getRecipeById);

router.post('/', protect, recipeRules, validate, createRecipe);
router.put('/:id', protect, recipeIdRule, recipeRules, validate, updateRecipe);
router.delete('/:id', protect, recipeIdRule, validate, deleteRecipe);

export default router;
