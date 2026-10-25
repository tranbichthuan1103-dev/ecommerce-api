export const getHealthStatus = async () => {
  return {
    status: 'OK',
    architecture: 'Monolithic',
    service: 'ecommerce-monolith-mvp',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
};

