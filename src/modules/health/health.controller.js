import { getHealthStatus } from './health.service.js';

export const checkHealth = async (_req, res, next) => {
  try {
    const healthData = await getHealthStatus();
    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};

