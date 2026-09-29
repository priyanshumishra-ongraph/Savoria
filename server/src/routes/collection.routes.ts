import express from 'express';
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getSharedCollection,
  addCollaborator,
  removeCollaborator
} from '../controllers/collection.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/shared/:token', getSharedCollection);

router.route('/')
  .post(protect, createCollection)
  .get(protect, getCollections);

router.route('/:id')
  .get(protect, getCollectionById)
  .put(protect, updateCollection)
  .delete(protect, deleteCollection);

router.route('/:id/recipes')
  .post(protect, addRecipeToCollection);

router.route('/:id/recipes/:recipeId')
  .delete(protect, removeRecipeFromCollection);

router.route('/:id/collaborators').post(protect, addCollaborator);
router.route('/:id/collaborators/:userId').delete(protect, removeCollaborator);

export default router;
