import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Recipe from '../models/Recipe';
import User from '../models/User';
import Notification from '../models/Notification';
import { emitToUser } from '../socket/socket';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendGroupedNotification } from '../utils/notification.util';

/**
 * Recalculate average rating for a recipe and save it
 */
const updateRecipeRating = async (recipeId: mongoose.Types.ObjectId) => {
  const stats = await Review.aggregate([
    { $match: { recipeId } },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 },
            },
          },
        ],
        distribution: [
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const overall = stats[0].overall[0];
  const distributionData = stats[0].distribution;

  if (overall) {
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distributionData.forEach((d: { _id: number; count: number }) => {
      if (d._id >= 1 && d._id <= 5) {
        ratingDistribution[d._id as keyof typeof ratingDistribution] = d.count;
      }
    });

    await Recipe.findByIdAndUpdate(recipeId, {
      averageRating: Math.round(overall.averageRating * 10) / 10,
      reviewCount: overall.reviewCount,
      ratingDistribution,
    });
  } else {
    // No reviews left
    await Recipe.findByIdAndUpdate(recipeId, {
      averageRating: 0,
      reviewCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }
};

/**
 * @desc    Add a review
 * @route   POST /api/reviews
 * @access  Private
 */
export const addReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipeId, rating, comment, sentiment } = req.body;
    const userId = req.user?.id;

    if (!recipeId || !rating || !comment) {
      res.status(400).json({ message: 'Please provide recipeId, rating, and comment' });
      return;
    }

    if (!mongoose.isValidObjectId(recipeId)) {
      res.status(400).json({ message: 'Invalid recipe ID' });
      return;
    }

    const recipeObjId = new mongoose.Types.ObjectId(recipeId);

    // Check if recipe exists
    const recipe = await Recipe.findById(recipeObjId);
    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }

    const existingReview = await Review.findOne({ recipeId: recipeObjId, userId });
    if (existingReview) {
      console.log('Found existing review:', existingReview);
      res.status(400).json({ message: 'You have already reviewed this recipe' });
      return;
    }

    const review = await Review.create({
      recipeId: recipeObjId,
      userId,
      rating,
      comment,
      sentiment: sentiment || 'NEUTRAL',
    });

    // Update recipe's average rating
    await updateRecipeRating(recipeObjId);

    await review.populate('userId', 'name avatarUrl');

    // ── Notification: tell the recipe owner someone reviewed their recipe ──
    await sendGroupedNotification({
      recipientId: recipe.owner.toString(),
      senderId: userId as string,
      type: 'review',
      recipeId: recipeObjId.toString(),
      recipeTitle: recipe.title,
      recipeImage: recipe.imageUrl || '',
    });

    res.status(201).json(review);
    } catch (error: any) {
    // Handle Mongoose duplicate key error (code 11000)
    if (error.code === 11000) {
      console.log('Duplicate key error in Review:', error);
      res.status(400).json({ message: 'You have already reviewed this recipe' });
      return;
    }
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get reviews for a recipe
 * @route   GET /api/reviews/:recipeId
 * @access  Public
 */
export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const { sort } = req.query; // e.g. 'newest', 'helpful', 'highest', 'lowest'

    let sortObj: any = { createdAt: -1 };
    if (sort === 'highest') sortObj = { rating: -1, createdAt: -1 };
    else if (sort === 'lowest') sortObj = { rating: 1, createdAt: -1 };

    if (sort === 'helpful') {
      const reviews = await Review.aggregate([
        { $match: { recipeId: new mongoose.Types.ObjectId(recipeId as string) } },
        {
          $addFields: {
            helpfulCount: { $size: { $ifNull: ['$helpfulVotes', []] } }
          }
        },
        { $sort: { helpfulCount: -1, createdAt: -1 } }
      ]);
      await Review.populate(reviews, { path: 'userId', select: 'name avatarUrl' });
      res.json(reviews);
      return;
    }

    const reviews = await Review.find({ recipeId })
      .populate('userId', 'name avatarUrl')
      .sort(sortObj);

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    const recipe = await Recipe.findById(review.recipeId);
    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }

    // Permissions: only review owner, recipe owner, or admin can delete
    const isReviewOwner = review.userId.toString() === userId;
    const isRecipeOwner = recipe.owner.toString() === userId;
    const isAdmin = req.user?.role === 'admin';

    if (!isReviewOwner && !isRecipeOwner && !isAdmin) {
      res.status(403).json({ message: 'Not authorized to delete this review' });
      return;
    }

    await review.deleteOne();

    // Update recipe's average rating
    await updateRecipeRating(review.recipeId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Toggle helpful vote
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
export const toggleHelpfulVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    const hasVoted = review.helpfulVotes && review.helpfulVotes.some(v => v.toString() === userId);

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      hasVoted 
        ? { $pull: { helpfulVotes: userId } }
        : { $addToSet: { helpfulVotes: userId } },
      { returnDocument: 'after' }
    ).populate('userId', 'name avatarUrl').populate('recipeId', 'title imageUrl');

    // ── Notification: tell the reviewer that someone found their review helpful ──
    if (!hasVoted) {
      await sendGroupedNotification({
        recipientId: review.userId.toString(),
        senderId: userId as string,
        type: 'helpful',
        recipeId: review.recipeId.toString(),
        recipeTitle: (updatedReview?.recipeId as any)?.title || 'A Recipe',
        recipeImage: (updatedReview?.recipeId as any)?.imageUrl || '',
      });
    }

    res.json(updatedReview);
  } catch (error) {
    console.error('Error toggling helpful vote:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Add owner reply to a review
 * @route   PATCH /api/reviews/:id/reply
 * @access  Private
 */
export const addOwnerReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.id;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      res.status(400).json({ message: 'Reply cannot be empty' });
      return;
    }

    const review = await Review.findById(reviewId).populate('recipeId', 'owner title imageUrl');
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    const recipe: any = review.recipeId;
    if (recipe.owner.toString() !== userId) {
      res.status(403).json({ message: 'Only the recipe owner can reply to reviews' });
      return;
    }

    review.ownerReply = reply;
    await review.save();

    await review.populate('userId', 'name avatarUrl');

    // ── Notification: tell the reviewer that the owner replied ──
    await sendGroupedNotification({
      recipientId: review.userId._id.toString(),
      senderId: userId as string,
      type: 'reply',
      recipeId: recipe._id.toString(),
      recipeTitle: recipe.title,
      recipeImage: recipe.imageUrl || '',
    });

    res.json(review);
  } catch (error) {
    console.error('Error adding owner reply:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
