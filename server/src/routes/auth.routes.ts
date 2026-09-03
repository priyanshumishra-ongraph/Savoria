import express from 'express';
import { registerUser, loginUser, getMe, getAllUsers, deleteUser } from '../controllers/auth.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', protect, admin, registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;