import { Router } from 'express';
import { authenticateJWT } from '../../middlewares/auth.middleware.js';
import { getMe } from './user.controller.js';

const router = Router();

// Bắt buộc có JWT hợp lệ mới truy cập được /api/users/me
router.get('/me', authenticateJWT, getMe);

export default router;

