import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  user: mongoose.Types.ObjectId;
  recipes: mongoose.Types.ObjectId[];
  collaborators: mongoose.Types.ObjectId[];
  coverImage?: string;
  isPublic: boolean;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: [true, 'Please add a collection name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
    collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    coverImage: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

collectionSchema.index({ user: 1, name: 1 }, { unique: true });

const Collection = mongoose.model<ICollection>('Collection', collectionSchema);

export default Collection;

