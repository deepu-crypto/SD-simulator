export const checkHealth = () => {
  return {
    status: 'UP',
    timestamp: new Date().toISOString(),
  };
};
