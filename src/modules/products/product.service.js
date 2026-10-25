import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/appError.js';

export const getAllProducts = async () => {
  const products = await prisma.product.findMany({
    orderBy: { pid: 'asc' },
  });

  return products.map((item) => ({
    pid: item.pid,
    pname: item.pname,
    price: Number(item.price),
    quantity: item.quantity,
  }));
};

export const getProductById = async (pid) => {
  const productId = Number(pid);
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new AppError('Mã sản phẩm (pid) không hợp lệ.', 400);
  }

  const product = await prisma.product.findUnique({
    where: { pid: productId },
  });

  if (!product) {
    throw new AppError(`Không tìm thấy sản phẩm có pid = ${productId}.`, 404);
  }

  return {
    pid: product.pid,
    pname: product.pname,
    price: Number(product.price),
    quantity: product.quantity,
  };
};

