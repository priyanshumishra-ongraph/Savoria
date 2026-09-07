import { Request, Response } from 'express';
import Recipe from '../models/Recipe';
import { AuthRequest } from '../middleware/auth.middleware';

import mongoose from 'mongoose';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayObjectId = new mongoose.Types.ObjectId(Math.floor(today.getTime() / 1000).toString(16) + '0000000000000000');

    const categoriesPipeline = [
      {
        $match: {
          $or: [
            { createdAt: { $gte: today } },
            { _id: { $gte: todayObjectId } }
          ]
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ];

    const categoryStatsRaw = await Recipe.aggregate(categoriesPipeline);
    
    // Transform to a simpler object { [category]: count }
    const categoryStats = categoryStatsRaw.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const latestRecipe = await Recipe.findOne()
      .sort({ createdAt: -1 })
      .populate('owner', 'name email avatarUrl');

    const totalRecipes = await Recipe.countDocuments();

    res.json({
      todayByCategory: categoryStats,
      latestRecipe,
      totalRecipes
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
