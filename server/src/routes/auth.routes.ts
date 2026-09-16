import express from 'express';
import { registerUser, loginUser, getMe, getAllUsers, deleteUser, adminRegisterUser, toggleUserActive } from '../controllers/auth.controller';
import { protect, admin } from '../middleware/auth.middleware';
import { registerRules, loginRules, adminRegisterRules, userIdRule } from '../validators/auth.validator';
import { validate } from '../validators/recipe.validator';

const router = express.Router();

router.post('/register', registerRules, validate, registerUser);
router.post('/admin-register', protect, admin, adminRegisterRules, validate, adminRegisterUser);
router.post('/login', loginRules, validate, loginUser);
router.get('/me', protect, getMe);
router.get('/users', protect, admin, getAllUsers);
router.patch('/users/:id/toggle-active', protect, admin, userIdRule, validate, toggleUserActive);
router.delete('/users/:id', protect, admin, userIdRule, validate, deleteUser);

export default router;
