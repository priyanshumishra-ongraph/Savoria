import { Response, NextFunction } from 'express';
import Recipe from '../models/Recipe';
import { AuthRequest } from '../middleware/auth.middleware';



export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [categoryStatsRaw, latestRecipe, totalRecipes, recentRecipes, quickAndEasy] = await Promise.all([
      Recipe.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]),
      Recipe.findOne()
        .sort({ createdAt: -1 })
        .populate('owner', 'name avatarUrl'),
      Recipe.countDocuments(),
      Recipe.find()
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('owner', 'name avatarUrl'),
      Recipe.aggregate([
        {
          $addFields: {
            totalTime: { $add: [{ $ifNull: ['$prepTimeMinutes', 0] }, { $ifNull: ['$cookTimeMinutes', 0] }] }
          }
        },
        {
          $match: { totalTime: { $lte: 30, $gt: 0 } }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 4 }
      ])
    ]);

    const categoryStats = categoryStatsRaw.reduce(
      (acc: Record<string, number>, curr: { _id: string; count: number }) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {}
    );

    res.json({
      todayByCategory: categoryStats,
      latestRecipe,
      totalRecipes,
      recentRecipes,
      quickAndEasy,
    });
  } catch (error) {
    next(error);
  }
};
