import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'review' | 'save' | 'reply' | 'helpful';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;   // recipe owner
  sender: mongoose.Types.ObjectId;      // user who reviewed / saved
  type: NotificationType;
  recipeId: mongoose.Types.ObjectId;
  recipeTitle: string;
  recipeImage?: string;
  senderName: string;
  senderAvatar?: string;
  read: boolean;
  groupedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['review', 'save', 'reply', 'helpful'],
      required: true,
    },
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    recipeTitle: { type: String, required: true },
    recipeImage: { type: String, default: '' },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    groupedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Most recent first by default
NotificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
