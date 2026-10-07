import express from 'express';
import { getDiscoverStats } from '../controllers/dashboard.controller';

const router = express.Router();

router.get('/stats', getDiscoverStats);

export default router;
