import {
  getHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
} from './health.service.js';

export const checkHealth = async (_req, res, next) => {
  try {
    const { isHealthy, ...healthData } = await getHealthStatus();
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      success: isHealthy,
      ...(isHealthy ? {} : { message: 'Database connection unavailable' }),
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};

export const checkLiveness = (_req, res) => {
  const livenessData = getLivenessStatus();
  res.status(200).json({
    success: true,
    data: livenessData,
  });
};

export const checkReadiness = async (_req, res, next) => {
  try {
    const { isReady, ...readinessData } = await getReadinessStatus();
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      success: isReady,
      ...(isReady ? {} : { message: 'Application is not ready: Database unreachable' }),
      data: readinessData,
    });
  } catch (error) {
    next(error);
  }
};
