import { NextFunction, Request, Response, Router } from 'express';
import multer, { MulterError } from 'multer';
import { bankTransferController } from '../controllers/bankTransfer.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createBankTransferSchema,
  listBankTransfersSchema,
} from '../validators/bankTransfer.validator';
import { leadSubmissionLimiter } from '../middleware/rateLimiter';
import { adminAuth } from '../middleware/adminAuth';
import { ApiError } from '../utils/ApiError';

const ALLOWED_INVOICE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// Stored in memory (not disk) — Render's filesystem is ephemeral, and the
// buffer is written straight into MongoDB alongside the submission record.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_INVOICE_MIME_TYPES.includes(file.mimetype)) {
      callback(new Error('INVALID_FILE_TYPE'));
      return;
    }
    callback(null, true);
  },
});

const handleInvoiceUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('invoice')(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(ApiError.badRequest('Invoice file must be 5MB or smaller'));
      return;
    }
    if (error instanceof Error && error.message === 'INVALID_FILE_TYPE') {
      next(ApiError.badRequest('Invoice must be a PDF, JPG, or PNG file'));
      return;
    }
    next(ApiError.badRequest('Failed to upload invoice file'));
  });
};

const router = Router();

router.get('/details', bankTransferController.getBankDetails);

router.post(
  '/',
  leadSubmissionLimiter,
  handleInvoiceUpload,
  validateRequest(createBankTransferSchema),
  bankTransferController.createSubmission
);

// Admin-only — exposes every submitter's contact details and invoice files.
router.get(
  '/',
  adminAuth,
  validateRequest(listBankTransfersSchema),
  bankTransferController.listSubmissions
);
router.get('/:id/invoice', adminAuth, bankTransferController.downloadInvoice);

export default router;
