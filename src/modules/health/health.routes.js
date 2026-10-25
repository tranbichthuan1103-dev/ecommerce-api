import { Router } from 'express';
import {
  checkHealth,
  checkLiveness,
  checkReadiness,
} from './health.controller.js';

const router = Router();

router.get('/', checkHealth);
router.get('/live', checkLiveness);
router.get('/ready', checkReadiness);

export default router;
