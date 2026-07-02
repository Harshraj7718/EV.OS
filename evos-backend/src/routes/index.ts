import { Router } from 'express';
import leadRoutes from './lead.routes';
import healthRoutes from './health.routes';
import paymentRoutes from './payment.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/leads', leadRoutes);
router.use('/payment', paymentRoutes);

export default router;
