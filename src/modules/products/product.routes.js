import { Router } from 'express';
import { getProductDetail, listProducts } from './product.controller.js';

const router = Router();

// Xem danh sách sản phẩm và tồn kho (Read-only)
router.get('/', listProducts);

// Xem chi tiết một sản phẩm theo pid (Read-only)
router.get('/:id', getProductDetail);

export default router;

