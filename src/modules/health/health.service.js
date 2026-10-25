import prisma from '../../config/prisma.js';

// 1. Liveness: Kiểm tra tiến trình Node.js/Express còn sống hay không (không phụ thuộc DB)
export const getLivenessStatus = () => {
  return {
    status: 'ALIVE',
    architecture: 'Monolithic',
    service: 'ecommerce-monolith-mvp',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
};

// 2. Readiness: Kiểm tra ứng dụng đã sẵn sàng phục vụ request và kết nối được PostgreSQL chưa
export const getReadinessStatus = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      isReady: true,
      status: 'READY',
      architecture: 'Monolithic',
      service: 'ecommerce-monolith-mvp',
      database: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  } catch (_error) {
    return {
      isReady: false,
      status: 'NOT_READY',
      architecture: 'Monolithic',
      service: 'ecommerce-monolith-mvp',
      database: 'DOWN',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
};

// 3. System Health Check tổng hợp (/api/health): Kiểm tra cả ứng dụng và kết nối PostgreSQL
export const getHealthStatus = async () => {
  const readiness = await getReadinessStatus();

  return {
    isHealthy: readiness.isReady,
    status: readiness.isReady ? 'OK' : 'DEGRADED',
    architecture: 'Monolithic',
    service: 'ecommerce-monolith-mvp',
    database: readiness.isReady ? 'Connected (PostgreSQL)' : 'Disconnected (PostgreSQL)',
    timestamp: readiness.timestamp,
    uptime: readiness.uptime,
  };
};
