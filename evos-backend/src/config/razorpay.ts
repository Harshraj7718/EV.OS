import Razorpay from 'razorpay';
import { env } from './env';

export const razorpayClient = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret,
});
