import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);

export default router;
