import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createOrderSchema,
  listPaymentsSchema,
  verifyPaymentSchema,
} from '../validators/payment.validator';
import { leadSubmissionLimiter } from '../middleware/rateLimiter';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.post(
  '/create-order',
  leadSubmissionLimiter,
  validateRequest(createOrderSchema),
  paymentController.createOrder
);
router.post('/verify', validateRequest(verifyPaymentSchema), paymentController.verifyPayment);

// Admin-only — exposes every customer's payment history.
router.get('/', adminAuth, validateRequest(listPaymentsSchema), paymentController.listPayments);

export default router;
