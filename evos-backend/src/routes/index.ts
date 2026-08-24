import { Router } from 'express';
import leadRoutes from './lead.routes';
import healthRoutes from './health.routes';
import paymentRoutes from './payment.routes';
import bankTransferRoutes from './bankTransfer.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/leads', leadRoutes);
router.use('/payment', paymentRoutes);
router.use('/bank-transfer', bankTransferRoutes);
router.use('/admin', adminRoutes);

export default router;
