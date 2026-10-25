import { getAllProducts, getProductById } from './product.service.js';

export const listProducts = async (_req, res, next) => {
  try {
    const products = await getAllProducts();
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductDetail = async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

