import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  ApiResponse.success(res, 200, 'EV.OS API is healthy', {
    status: 'ok',
    database: dbState,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
