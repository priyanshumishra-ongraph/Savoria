import express from 'express';
import { addReview, getReviews, deleteReview, toggleHelpfulVote, addOwnerReply } from '../controllers/review.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .post(protect, addReview);

router.route('/:recipeId')
  .get(getReviews);

router.route('/:id')
  .delete(protect, deleteReview);

router.route('/:id/helpful')
  .post(protect, toggleHelpfulVote);

router.route('/:id/reply')
  .patch(protect, addOwnerReply);

export default router;
