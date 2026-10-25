import {
  getShipmentsByOrderId,
  getUserShipments,
} from './shipment.service.js';

export const listMyShipments = async (req, res, next) => {
  try {
    const shipments = await getUserShipments(req.user.uid);
    res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderShipment = async (req, res, next) => {
  try {
    const shipments = await getShipmentsByOrderId(req.user.uid, req.params.oid);
    res.status(200).json({
      success: true,
      data: shipments,
    });
  } catch (error) {
    next(error);
  }
};

