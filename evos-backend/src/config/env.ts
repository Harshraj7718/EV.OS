import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  mongodbUri: string;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  razorpayKeyId: string;
  razorpayKeySecret: string;
}

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  port: Number(process.env.PORT) || 5000,
  mongodbUri: requireEnv('MONGODB_URI'),
  nodeEnv: (process.env.NODE_ENV as EnvConfig['nodeEnv']) || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  razorpayKeyId: requireEnv('RAZORPAY_KEY_ID'),
  razorpayKeySecret: requireEnv('RAZORPAY_KEY_SECRET'),
};
