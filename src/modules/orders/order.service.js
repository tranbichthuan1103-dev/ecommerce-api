import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/appError.js';

// Trạng thái khởi tạo mặc định của đơn giao vận khi đặt hàng thành công
export const INITIAL_SHIPMENT_STATUS = 'Pending';

// Định dạng dữ liệu Order trả về client
const formatOrderResponse = (order) => {
  const details = (order.orderDetails || []).map((detail) => {
    const unitPrice = Number(detail.unit_price);
    return {
      oid: detail.oid,
      pid: detail.pid,
      pname: detail.product?.pname,
      qty: detail.qty,
      unit_price: unitPrice,
      line_total: Number((unitPrice * detail.qty).toFixed(2)),
    };
  });

  const totalAmount = Number(
    details.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)
  );

  const shipments = (order.shipments || []).map((ship) => ({
    shipid: ship.shipid,
    oid: ship.oid,
    status: ship.status,
  }));

  return {
    oid: order.oid,
    uid: order.uid,
    createat: order.createat,
    total_amount: totalAmount,
    orderDetails: details,
    shipment: shipments[0] || null,
    shipments,
  };
};

// Kiểm tra và gộp các dòng cùng pid trong danh sách items
const validateAndMergeOrderItems = (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError(
      'Danh sách sản phẩm đặt mua (items) phải là mảng và không được để trống.',
      400
    );
  }

  const mergedMap = new Map();

  for (let i = 0; i < rawItems.length; i += 1) {
    const item = rawItems[i];
    const pid = Number(item?.pid);
    const qty = Number(item?.qty);

    if (!Number.isInteger(pid) || pid <= 0) {
      throw new AppError(
        `Dòng sản phẩm thứ ${i + 1} có mã sản phẩm (pid) không hợp lệ. Yêu cầu số nguyên dương.`,
        400
      );
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError(
        `Sản phẩm pid = ${pid} có số lượng đặt mua (qty) không hợp lệ. Yêu cầu số nguyên dương lớn hơn 0.`,
        400
      );
    }

    // Gộp số lượng nếu client truyền trùng pid trong cùng một đơn hàng
    const currentQty = mergedMap.get(pid) || 0;
    mergedMap.set(pid, currentQty + qty);
  }

  // Sắp xếp theo pid tăng dần để cố định thứ tự khóa dòng (tránh Deadlock khi giao dịch đồng thời)
  return Array.from(mergedMap.entries())
    .map(([pid, qty]) => ({ pid, qty }))
    .sort((a, b) => a.pid - b.pid);
};

export const createOrder = async (uid, payload) => {
  const userId = Number(uid);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Định danh người dùng không hợp lệ.', 401);
  }

  // 1. Validate và gộp các mặt hàng trùng pid (bỏ qua mọi giá price do client tự truyền)
  const items = validateAndMergeOrderItems(payload?.items);
  const productIds = items.map((item) => item.pid);

  // 2. Thực thi toàn bộ quy trình đặt hàng trong 1 Prisma Interactive Transaction nguyên tử
  const createdOrder = await prisma.$transaction(async (tx) => {
    // 2.1. Kiểm tra người dùng tồn tại
    const user = await tx.user.findUnique({
      where: { uid: userId },
    });

    if (!user) {
      throw new AppError('Tài khoản người dùng không tồn tại.', 404);
    }

    // 2.2. Truy vấn thông tin sản phẩm thực tế từ DB để lấy giá bán (price) và kiểm tra sự tồn tại
    const products = await tx.product.findMany({
      where: { pid: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.pid, p]));

    for (const item of items) {
      const product = productMap.get(item.pid);
      if (!product) {
        throw new AppError(`Sản phẩm có pid = ${item.pid} không tồn tại.`, 404);
      }

      if (product.quantity < item.qty) {
        throw new AppError(
          `Sản phẩm "${product.pname}" (pid=${item.pid}) không đủ tồn kho. Yêu cầu: ${item.qty}, Tồn kho hiện tại: ${product.quantity}.`,
          400
        );
      }
    }

    // 2.3. Trừ tồn kho có điều kiện nguyên tử (Atomic Conditional Update)
    // Chỉ trừ khi quantity hiện tại trong DB >= item.qty để chống bán vượt tồn kho (Race Condition)
    for (const item of items) {
      const product = productMap.get(item.pid);
      const updated = await tx.product.updateMany({
        where: {
          pid: item.pid,
          quantity: {
            gte: item.qty,
          },
        },
        data: {
          quantity: {
            decrement: item.qty,
          },
        },
      });

      if (updated.count !== 1) {
        throw new AppError(
          `Sản phẩm "${product.pname}" (pid=${item.pid}) không đủ tồn kho tại thời điểm xử lý giao dịch.`,
          400
        );
      }
    }

    // 2.4. Tạo bản ghi Order với thời gian hiện hành
    const order = await tx.order.create({
      data: {
        uid: userId,
        createat: new Date(),
      },
    });

    // 2.5. Tạo các bản ghi OrderDetail với unit_price lấy từ bảng Product tại thời điểm mua
    await tx.orderDetail.createMany({
      data: items.map((item) => {
        const product = productMap.get(item.pid);
        return {
          oid: order.oid,
          pid: item.pid,
          qty: item.qty,
          unit_price: product.price,
        };
      }),
    });

    // 2.6. Tạo bản ghi Shipment gắn với đơn hàng vừa tạo
    await tx.shipment.create({
      data: {
        oid: order.oid,
        status: INITIAL_SHIPMENT_STATUS,
      },
    });

    // 2.7. Truy vấn lại đầy đủ Order + OrderDetail + Product + Shipment để trả về
    return tx.order.findUnique({
      where: { oid: order.oid },
      include: {
        orderDetails: {
          include: {
            product: true,
          },
          orderBy: { pid: 'asc' },
        },
        shipments: {
          orderBy: { shipid: 'asc' },
        },
      },
    });
  });

  return formatOrderResponse(createdOrder);
};

export const getUserOrders = async (uid) => {
  const userId = Number(uid);
  const orders = await prisma.order.findMany({
    where: { uid: userId },
    include: {
      orderDetails: {
        include: { product: true },
        orderBy: { pid: 'asc' },
      },
      shipments: {
        orderBy: { shipid: 'asc' },
      },
    },
    orderBy: { oid: 'desc' },
  });

  return orders.map(formatOrderResponse);
};

export const getOrderById = async (uid, oid) => {
  const userId = Number(uid);
  const orderId = Number(oid);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new AppError('Mã đơn hàng (oid) không hợp lệ.', 400);
  }

  const order = await prisma.order.findUnique({
    where: { oid: orderId },
    include: {
      orderDetails: {
        include: { product: true },
        orderBy: { pid: 'asc' },
      },
      shipments: {
        orderBy: { shipid: 'asc' },
      },
    },
  });

  if (!order || order.uid !== userId) {
    throw new AppError(`Không tìm thấy đơn hàng có oid = ${orderId}.`, 404);
  }

  return formatOrderResponse(order);
};

