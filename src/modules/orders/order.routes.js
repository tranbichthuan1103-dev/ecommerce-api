import { Router } from 'express';
import { authenticateJWT } from '../../middlewares/auth.middleware.js';
import {
  getOrderDetail,
  listMyOrders,
  placeOrder,
} from './order.controller.js';

const router = Router();

// Tất cả các API đơn hàng đều bắt buộc xác thực JWT
router.use(authenticateJWT);

router.post('/', placeOrder);
router.get('/', listMyOrders);
router.get('/:id', getOrderDetail);

export default router;

