import {
  bankTransferRepository,
  BankTransferRepository,
} from '../repositories/bankTransfer.repository';
import { leadService, LeadService } from './lead.service';
import { ICreateBankTransferDto, IBankTransferResult } from '../interfaces/bankTransfer.interface';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { resolvePlanAmount } from '../constants/plans';

export class BankTransferService {
  constructor(
    private readonly repository: BankTransferRepository,
    private readonly leads: LeadService
  ) {}

  async createSubmission(dto: ICreateBankTransferDto): Promise<IBankTransferResult> {
    // Never trust a client-supplied amount — resolve it server-side from the plan.
    const canonicalAmount = resolvePlanAmount(dto.plan);
    if (!canonicalAmount) {
      throw ApiError.badRequest('Invalid investment plan selected');
    }

    const submission = await this.repository.create({
      ...dto,
      investmentAmount: canonicalAmount,
    });

    await this.leads.captureLeadSilently({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      city: 'Not Specified',
      interest: 'Investor',
      budget: `₹${canonicalAmount.toLocaleString('en-IN')}`,
      message: `Submitted a bank transfer invoice for the ${dto.plan} Investment Plan — pending verification.`,
    });

    logger.info(
      `Bank transfer submission received: ${submission.id} (${dto.plan}, ₹${canonicalAmount})`
    );

    return {
      id: submission.id,
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      plan: submission.plan,
      investmentAmount: submission.investmentAmount,
      status: submission.status,
      createdAt: submission.createdAt,
    };
  }
}

export const bankTransferService = new BankTransferService(bankTransferRepository, leadService);
