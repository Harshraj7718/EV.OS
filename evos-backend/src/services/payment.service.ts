import crypto from 'node:crypto';
import { razorpayClient } from '../config/razorpay';
import { env } from '../config/env';
import { paymentRepository, PaymentRepository } from '../repositories/payment.repository';
import { leadService, LeadService } from './lead.service';
import {
  ICreateOrderDto,
  ICreateOrderResult,
  IVerifyPaymentDto,
  PlanId,
} from '../interfaces/payment.interface';
import { IPaymentDocument } from '../models/payment.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

const PAYABLE_PLAN_AMOUNTS: Record<Exclude<PlanId, 'Custom'>, number> = {
  Starter: 140000,
  Growth: 350000,
  Enterprise: 700000,
};

export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly leads: LeadService
  ) {}

  async createOrder(dto: ICreateOrderDto): Promise<ICreateOrderResult> {
    if (dto.plan === 'Custom') {
      throw ApiError.badRequest('Custom Fleet plans are handled via Contact Sales, not checkout');
    }

    // Never trust a client-supplied amount — resolve it server-side from the plan.
    const canonicalAmount = PAYABLE_PLAN_AMOUNTS[dto.plan];
    if (!canonicalAmount) {
      throw ApiError.badRequest('Invalid investment plan selected');
    }

    let order: { id: string };
    try {
      order = await razorpayClient.orders.create({
        amount: canonicalAmount * 100,
        currency: 'INR',
        receipt: `evos_${dto.plan.toLowerCase()}_${Date.now()}`,
        notes: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          plan: dto.plan,
        },
      });
    } catch (error) {
      // The Razorpay SDK doesn't throw real Error objects — it rejects with
      // { statusCode, error: { description, code, ... } }, so it must be
      // unpacked explicitly or the real failure reason is lost.
      const razorpayError = error as { statusCode?: number; error?: { description?: string; code?: string } };
      const description = razorpayError?.error?.description || razorpayError?.error?.code;
      logger.error(`Razorpay order creation failed: ${JSON.stringify(razorpayError?.error ?? error)}`);
      throw ApiError.badRequest(
        description ? `Payment gateway error: ${description}` : 'Failed to create payment order'
      );
    }

    await this.repository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      plan: dto.plan,
      investmentAmount: canonicalAmount,
      razorpay_order_id: order.id,
    });

    logger.info(`Razorpay order created: ${order.id} (${dto.plan}, ₹${canonicalAmount})`);

    return {
      orderId: order.id,
      amount: canonicalAmount * 100,
      currency: 'INR',
      keyId: env.razorpayKeyId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      plan: dto.plan,
      investmentAmount: canonicalAmount,
    };
  }

  async verifyPayment(dto: IVerifyPaymentDto): Promise<IPaymentDocument> {
    const payment = await this.repository.findByOrderId(dto.razorpay_order_id);
    if (!payment) {
      throw ApiError.notFound('No payment order found for this order ID');
    }

    const isValidSignature = this.verifySignature(dto);

    if (!isValidSignature) {
      await this.repository.markStatus(dto.razorpay_order_id, 'failed');
      logger.warn(`Payment signature verification failed for order: ${dto.razorpay_order_id}`);
      throw ApiError.badRequest('Payment verification failed. Signature mismatch.');
    }

    const updated = await this.repository.markStatus(
      dto.razorpay_order_id,
      'paid',
      dto.razorpay_payment_id
    );

    if (!updated) {
      throw ApiError.internal('Failed to update payment record');
    }

    await this.leads.captureLeadSilently({
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      city: 'Not Specified',
      interest: 'Investor',
      budget: `₹${updated.investmentAmount.toLocaleString('en-IN')}`,
      message: `Completed payment for the ${updated.plan} Investment Plan (Razorpay order ${updated.razorpay_order_id}).`,
    });

    logger.info(`Payment verified and lead captured for order: ${dto.razorpay_order_id}`);

    return updated;
  }

  private verifySignature(dto: IVerifyPaymentDto): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', env.razorpayKeySecret)
      .update(`${dto.razorpay_order_id}|${dto.razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(dto.razorpay_signature);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}

export const paymentService = new PaymentService(paymentRepository, leadService);
