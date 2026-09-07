import { Response } from 'express';
import Recipe from '../models/Recipe';
import { AuthRequest } from '../middleware/auth.middleware';

const serverError = (res: Response, error: unknown): void => {
  if (process.env.NODE_ENV !== 'production') {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  } else {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [categoryStatsRaw, latestRecipe, totalRecipes] = await Promise.all([
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
        .populate('owner', 'name email avatarUrl'),
      Recipe.countDocuments(),
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
    });
  } catch (error) {
    serverError(res, error);
  }
};
