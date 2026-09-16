import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

export const recipeRules = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ max: 300 }).withMessage('Description max 300 characters'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard'),
  body('category').isIn(['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Beverage', 'Snack']).withMessage('Invalid category'),
  body('ingredients').isArray({ min: 1 }).withMessage('At least one ingredient is required'),
  body('ingredients.*.name').notEmpty().withMessage('Ingredient name is required'),
  body('ingredients.*.quantity').notEmpty().withMessage('Ingredient quantity is required'),
  body('steps').isArray({ min: 1 }).withMessage('At least one step is required'),
  body('steps.*').isString().notEmpty().withMessage('Step description cannot be empty'),
  body('prepTimeMinutes').optional().isInt({ min: 0 }).withMessage('Prep time must be a positive number'),
  body('cookTimeMinutes').optional().isInt({ min: 0 }).withMessage('Cook time must be a positive number'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().isString().trim().notEmpty().withMessage('Tag must be a non-empty string'),
  body('imageUrl').optional({ values: 'falsy' }).isString().withMessage('Image URL must be a string'),
];

export const recipeIdRule = [
  param('id').isMongoId().withMessage('Invalid Recipe ID format')
];

export const recipeQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('search').optional().isString().withMessage('Search must be a string')
];
