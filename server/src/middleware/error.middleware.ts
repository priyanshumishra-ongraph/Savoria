import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (statusCode !== 404) {
    console.error('Captured error in middleware:', err);
  } else if (!req.originalUrl.startsWith('/uploads/')) {
    console.warn(`404 Not Found: ${req.originalUrl}`);
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  // MongoDB $text / bad query operator errors (e.g. search="(")
  if (err.name === 'MongoServerError' || err.name === 'MongoError') {
    statusCode = 400;
    message = 'Invalid search query';
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
