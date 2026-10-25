import prisma from '../../config/prisma.js';

export const getHealthStatus = async () => {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: 'OK',
    architecture: 'Monolithic',
    service: 'ecommerce-monolith-mvp',
    database: 'Connected (PostgreSQL)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
};
