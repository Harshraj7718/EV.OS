import { Router } from 'express';
import { adminLogin } from '../controllers/admin.controller';
import { validateRequest } from '../middleware/validateRequest';
import { adminLoginSchema } from '../validators/admin.validator';
import { leadSubmissionLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', leadSubmissionLimiter, validateRequest(adminLoginSchema), adminLogin);

export default router;
