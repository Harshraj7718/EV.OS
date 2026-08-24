import crypto from 'node:crypto';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AdminLoginInput } from '../validators/admin.validator';

// Hash-then-compare so the comparison is constant-time regardless of input
// length (avoids leaking username/password length via timing).
const safeCompare = (a: string, b: string): boolean => {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as AdminLoginInput;

  const isValidUsername = safeCompare(username, env.adminUsername);
  const isValidPassword = safeCompare(password, env.adminPassword);

  if (!isValidUsername || !isValidPassword) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  const token = jwt.sign({ role: 'admin' }, env.jwtSecret, { expiresIn: '12h' });

  return ApiResponse.success(res, 200, 'Login successful', { token });
});
