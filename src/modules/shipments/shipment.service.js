import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/appError.js';

export const getUserShipments = async (uid) => {
  const userId = Number(uid);
  const shipments = await prisma.shipment.findMany({
    where: {
      order: {
        uid: userId,
      },
    },
    include: {
      order: {
        include: {
          orderDetails: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: { shipid: 'desc' },
  });

  return shipments.map((ship) => ({
    shipid: ship.shipid,
    oid: ship.oid,
    status: ship.status,
    createat: ship.order?.createat,
    orderDetails: (ship.order?.orderDetails || []).map((d) => ({
      pid: d.pid,
      pname: d.product?.pname,
      qty: d.qty,
      unit_price: Number(d.unit_price),
    })),
  }));
};

export const getShipmentsByOrderId = async (uid, oid) => {
  const userId = Number(uid);
  const orderId = Number(oid);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new AppError('Mã đơn hàng (oid) không hợp lệ.', 400);
  }

  const order = await prisma.order.findUnique({
    where: { oid: orderId },
    include: {
      shipments: {
        orderBy: { shipid: 'asc' },
      },
    },
  });

  if (!order || order.uid !== userId) {
    throw new AppError(`Không tìm thấy đơn hàng có oid = ${orderId}.`, 404);
  }

  return order.shipments.map((ship) => ({
    shipid: ship.shipid,
    oid: ship.oid,
    status: ship.status,
  }));
};

