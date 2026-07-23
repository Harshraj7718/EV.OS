import { Request, Response } from 'express';
import { bankTransferService, BankTransferService } from '../services/bankTransfer.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { CreateBankTransferInput } from '../validators/bankTransfer.validator';
import { BANK_TRANSFER_DETAILS } from '../constants/plans';

const MAX_INVOICE_BYTES = 5 * 1024 * 1024;
const ALLOWED_INVOICE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export class BankTransferController {
  constructor(private readonly service: BankTransferService) {}

  getBankDetails = asyncHandler(async (_req: Request, res: Response) => {
    return ApiResponse.success(res, 200, 'Bank details retrieved successfully', BANK_TRANSFER_DETAILS);
  });

  createSubmission = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as CreateBankTransferInput;
    const file = req.file;

    if (!file) {
      throw ApiError.badRequest('An invoice file (PDF, JPG, or PNG) is required');
    }
    if (!ALLOWED_INVOICE_MIME_TYPES.includes(file.mimetype)) {
      throw ApiError.badRequest('Invoice must be a PDF, JPG, or PNG file');
    }
    if (file.size > MAX_INVOICE_BYTES) {
      throw ApiError.badRequest('Invoice file must be 5MB or smaller');
    }

    const result = await this.service.createSubmission({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      plan: dto.plan,
      invoiceFileName: file.originalname,
      invoiceFileMimeType: file.mimetype,
      invoiceFileData: file.buffer,
    });

    return ApiResponse.success(res, 201, 'Invoice submitted successfully', result);
  });
}

export const bankTransferController = new BankTransferController(bankTransferService);
