import { Router } from 'express';
import { authenticateJWT } from '../../middlewares/auth.middleware.js';
import {
  getOrderShipment,
  listMyShipments,
} from './shipment.controller.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', listMyShipments);
router.get('/order/:oid', getOrderShipment);

export default router;

