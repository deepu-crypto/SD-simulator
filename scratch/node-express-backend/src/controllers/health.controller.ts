import { Request, Response } from 'express';
import { checkHealth } from '../services/health.service';

export const getHealthStatus = (req: Request, res: Response) => {
  const status = checkHealth();
  res.status(200).json(status);
};
