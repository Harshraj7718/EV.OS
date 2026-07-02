import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createLeadSchema, listLeadsSchema } from '../validators/lead.validator';
import { leadSubmissionLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', leadSubmissionLimiter, validateRequest(createLeadSchema), leadController.createLead);
router.get('/', validateRequest(listLeadsSchema), leadController.listLeads);
router.get('/:id', leadController.getLeadById);

export default router;
