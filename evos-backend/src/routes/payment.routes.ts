import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createOrderSchema, verifyPaymentSchema } from '../validators/payment.validator';
import { leadSubmissionLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/create-order',
  leadSubmissionLimiter,
  validateRequest(createOrderSchema),
  paymentController.createOrder
);
router.post('/verify', validateRequest(verifyPaymentSchema), paymentController.verifyPayment);

export default router;
