import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';

const router = Router();

// Gắn các module route vào prefix tương ứng
router.use('/health', healthRoutes);

export default router;

