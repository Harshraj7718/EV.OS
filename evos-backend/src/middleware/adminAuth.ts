import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export const adminAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired session. Please log in again.'));
  }
};
