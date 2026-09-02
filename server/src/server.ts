import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import recipeRoutes from './routes/recipe.routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  optionsSuccessStatus: 200,
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: 'Too many requests, please try again later.' }
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api', apiLimiter);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});