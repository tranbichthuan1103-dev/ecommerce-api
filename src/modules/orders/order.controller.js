import {
  createOrder,
  getOrderById,
  getUserOrders,
} from './order.service.js';

export const placeOrder = async (req, res, next) => {
  try {
    // Lấy uid trực tiếp từ JWT đã được xác thực (req.user.uid), không nhận uid từ body
    const orderData = await createOrder(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công và đã khởi tạo thông tin vận chuyển (Shipment).',
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
};

export const listMyOrders = async (req, res, next) => {
  try {
    const orders = await getUserOrders(req.user.uid);
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetail = async (req, res, next) => {
  try {
    const order = await getOrderById(req.user.uid, req.params.id);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

