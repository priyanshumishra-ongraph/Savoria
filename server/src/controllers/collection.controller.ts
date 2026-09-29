import { Request, Response } from 'express';
import Collection from '../models/Collection';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';
import mongoose from 'mongoose';


export const getCollections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const collections = await Collection.find({ $or: [{ user: req.user?.id }, { collaborators: req.user?.id }] })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'recipes', populate: { path: 'owner', select: 'name' } })
      .sort({ createdAt: -1 });

    const total = await Collection.countDocuments({ $or: [{ user: req.user?.id }, { collaborators: req.user?.id }] });

    res.json({
      collections,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


export const getCollectionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate({
        path: 'recipes',
        select: 'title imageUrl difficulty category prepTimeMinutes cookTimeMinutes ingredients tags averageRating reviewCount owner',
        populate: { path: 'owner', select: 'name avatarUrl' }
      })
      .populate('collaborators', 'name avatarUrl');

    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }

    const isCollab = collection.collaborators && collection.collaborators.some((c: any) => c._id ? c._id.toString() === req.user?.id : c.toString() === req.user?.id);
    if (collection.user.toString() !== req.user?.id && !collection.isPublic && !isCollab) {
      res.status(403).json({ message: 'Not authorized to view this collection' });
      return;
    }

    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


export const createCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, isPublic } = req.body;

    const shareToken = crypto.randomBytes(16).toString('hex');

    const collection = await Collection.create({
      name,
      user: req.user?.id,
      isPublic: isPublic || false,
      shareToken,
    });

    res.status(201).json(collection);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'A collection with this name already exists' });
      return;
    }
    res.status(500).json({ message: 'Server Error' });
  }
};


export const addRecipeToCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.body;
    const collectionId = req.params.id;

    const collection = await Collection.findOne({ _id: collectionId, $or: [{ user: req.user?.id }, { collaborators: req.user?.id }] });
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }

    const recipeObjId = new mongoose.Types.ObjectId(recipeId);

    const isAlreadyInCollection = collection.recipes.some(r => r.toString() === recipeId);

    if (isAlreadyInCollection) {
      res.status(400).json({ message: 'Recipe already in collection' });
      return;
    }

    collection.recipes.push(recipeObjId);
    await collection.save();

    await collection.populate({ path: 'recipes', populate: { path: 'owner', select: 'name' } });

    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


export const removeRecipeFromCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const collectionId = req.params.id;

    const collection = await Collection.findOne({ _id: collectionId, $or: [{ user: req.user?.id }, { collaborators: req.user?.id }] });
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }

    collection.recipes = collection.recipes.filter(id => id.toString() !== recipeId);
    await collection.save();

    res.json({ message: 'Recipe removed from collection', collectionId, recipeId });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


export const updateCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, isPublic, coverImage } = req.body;
    const collection = await Collection.findOne({ _id: req.params.id, user: req.user?.id });
    
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }

    if (name) collection.name = name;
    if (isPublic !== undefined) collection.isPublic = isPublic;
    if (coverImage !== undefined) collection.coverImage = coverImage;

    await collection.save();
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


export const deleteCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const collection = await Collection.findOneAndDelete({ _id: req.params.id, user: req.user?.id });
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


export const getSharedCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const collection = await Collection.findOne({ shareToken: req.params.token })
      .populate({ path: 'recipes', populate: { path: 'owner', select: 'name' } })
      .populate('user', 'name avatarUrl');

    if (!collection) {
      res.status(404).json({ message: 'Shared collection not found' });
      return;
    }

    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// COLLABORATOR ENDPOINTS
export const addCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const collection = await Collection.findOne({ _id: req.params.id, user: req.user?.id });
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' }); 
      return; 
    }

    const userToAdd = await User.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') });
    if (!userToAdd) { 
            res.status(404).json({ message: 'User not found with this email' }); return; 
    }
    if (userToAdd._id.toString() === req.user?.id) { res.status(400).json({ message: 'Cannot add yourself' }); return; }

    if (collection.collaborators.includes(userToAdd._id)) {
      res.status(400).json({ message: 'User is already a collaborator' });
      return;
    }

    collection.collaborators.push(userToAdd._id);
    await collection.save();
    
    // Return updated populated collection
    await collection.populate({ path: 'recipes', populate: { path: 'owner', select: 'name' } });
    await collection.populate('collaborators', 'name avatarUrl');
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const removeCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const collection = await Collection.findOne({ _id: req.params.id, user: req.user?.id });
    if (!collection) { res.status(404).json({ message: 'Collection not found' }); return; }

    collection.collaborators = collection.collaborators.filter(c => c.toString() !== userId);
    await collection.save();
    
    await collection.populate({ path: 'recipes', populate: { path: 'owner', select: 'name' } });
    await collection.populate('collaborators', 'name avatarUrl');
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
