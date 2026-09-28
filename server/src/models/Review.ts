import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  recipeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  sentiment?: string;
  helpfulVotes: mongoose.Types.ObjectId[];
  ownerReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      required: [true, 'Recipe ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    sentiment: {
      type: String,
      enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'],
      default: 'NEUTRAL',
    },
    helpfulVotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    ownerReply: {
      type: String,
      trim: true,
      maxlength: [500, 'Reply cannot exceed 500 characters'],
    }
  },
  {
    timestamps: true,
  }
);

// Apply a unique compound index to prevent multiple reviews from the same user on the same recipe
reviewSchema.index({ recipeId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model<IReview>('Review', reviewSchema);
export default Review;
