import crypto from 'node:crypto';
import { razorpayClient } from '../config/razorpay';
import { env } from '../config/env';
import { paymentRepository, PaymentRepository } from '../repositories/payment.repository';
import { leadService, LeadService } from './lead.service';
import {
  ICreateOrderDto,
  ICreateOrderResult,
  IPaymentListQuery,
  IVerifyPaymentDto,
} from '../interfaces/payment.interface';
import { IPaginatedResult } from '../interfaces/lead.interface';
import { IPaymentDocument } from '../models/payment.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { resolvePlanAmount } from '../constants/plans';

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
    const canonicalAmount = resolvePlanAmount(dto.plan);
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
      const razorpayError = error as {
        statusCode?: number;
        error?: { description?: string; code?: string };
      };
      const description = razorpayError?.error?.description || razorpayError?.error?.code;
      logger.error(
        `Razorpay order creation failed: ${JSON.stringify(razorpayError?.error ?? error)}`
      );
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

  async listPayments(query: IPaymentListQuery): Promise<IPaginatedResult<IPaymentDocument>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { items, total } = await this.repository.findAll({ ...query, page, limit });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
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

    const updated = await this.markPaidAndCaptureLead(
      dto.razorpay_order_id,
      dto.razorpay_payment_id
    );

    logger.info(`Payment verified and lead captured for order: ${dto.razorpay_order_id}`);

    return updated;
  }

  /**
   * Razorpay server-to-server webhook. The signature is an HMAC-SHA256 of the *raw* request body
   * keyed with the webhook secret configured in the Razorpay dashboard. Once verified, the event
   * updates our payment record and is relayed unchanged to Interakt (if configured).
   */
  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined): Promise<void> {
    if (!env.razorpayWebhookSecret) {
      throw ApiError.internal('Webhook is not configured on this server');
    }
    if (!rawBody || !signature || !this.verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Razorpay webhook rejected: invalid signature');
      throw ApiError.badRequest('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
    };
    const entity = event.payload?.payment?.entity;
    const orderId = entity?.order_id;

    if (orderId && entity?.id) {
      const payment = await this.repository.findByOrderId(orderId);
      if (payment && payment.payment_status !== 'paid') {
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
          await this.markPaidAndCaptureLead(orderId, entity.id);
        } else if (event.event === 'payment.failed') {
          await this.repository.markStatus(orderId, 'failed');
        }
      }
    }

    logger.info(
      `Razorpay webhook processed: ${event.event ?? 'unknown'} (${orderId ?? 'no order'})`
    );
    void this.forwardToInterakt(rawBody, signature);
  }

  private async markPaidAndCaptureLead(
    orderId: string,
    paymentId: string
  ): Promise<IPaymentDocument> {
    const updated = await this.repository.markStatus(orderId, 'paid', paymentId);
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

    return updated;
  }

  private async forwardToInterakt(rawBody: Buffer, signature: string): Promise<void> {
    if (!env.interaktWebhookUrl) return;

    try {
      const response = await fetch(env.interaktWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': signature },
        body: rawBody,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        logger.warn(`Interakt webhook responded with ${response.status}`);
      }
    } catch (error) {
      logger.error(`Failed to forward webhook to Interakt: ${(error as Error).message}`);
    }
  }

  private verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', env.razorpayWebhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signature);
    return (
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    );
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
