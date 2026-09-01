import { body, param, validationResult } from 'express-validator';
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
];

export const recipeIdRule = [
  param('id').isMongoId().withMessage('Invalid Recipe ID format')
];
