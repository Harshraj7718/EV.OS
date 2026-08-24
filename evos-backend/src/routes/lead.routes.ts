import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createLeadSchema, listLeadsSchema } from '../validators/lead.validator';
import { leadSubmissionLimiter } from '../middleware/rateLimiter';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Public — used by the site's own lead capture / payment flows.
router.post('/', leadSubmissionLimiter, validateRequest(createLeadSchema), leadController.createLead);

// Admin-only — exposes every customer's contact details.
router.get('/', adminAuth, validateRequest(listLeadsSchema), leadController.listLeads);
router.get('/:id', adminAuth, leadController.getLeadById);

export default router;
