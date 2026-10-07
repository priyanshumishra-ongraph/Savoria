import 'dotenv/config';
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import recipeRoutes from './routes/recipe.routes';
import discoverRoutes from './routes/dashboard.routes';
import uploadRoutes from './routes/upload.routes';
import newsletterRoutes from './routes/newsletter.routes';
import reviewRoutes from './routes/review.routes';
import collectionRoutes from './routes/collection.routes';
import favoriteRoutes from './routes/favorite.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initSocket } from './socket/socket';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Trust the reverse proxy (Render) so rate limiting uses the correct IP
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:4200';

const corsOptions = {
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  // Initialise Socket.IO after DB is ready
  initSocket(httpServer, CLIENT_URL);

  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Socket.IO listening on ws://localhost:${PORT}`);
  });
});
