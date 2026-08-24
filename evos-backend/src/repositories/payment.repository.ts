import { PaymentModel, IPaymentDocument } from '../models/payment.model';
import { ICreateOrderDto, IPaymentListQuery, PaymentStatus } from '../interfaces/payment.interface';

export class PaymentRepository {
  async create(dto: ICreateOrderDto & { razorpay_order_id: string }): Promise<IPaymentDocument> {
    return PaymentModel.create({
      ...dto,
      payment_status: 'created',
    });
  }

  async findAll(query: IPaymentListQuery): Promise<{ items: IPaymentDocument[]; total: number }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const filter = query.status ? { payment_status: query.status } : {};

    const [items, total] = await Promise.all([
      PaymentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      PaymentModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findByOrderId(orderId: string): Promise<IPaymentDocument | null> {
    return PaymentModel.findOne({ razorpay_order_id: orderId }).exec();
  }

  async markStatus(
    orderId: string,
    status: PaymentStatus,
    paymentId?: string
  ): Promise<IPaymentDocument | null> {
    return PaymentModel.findOneAndUpdate(
      { razorpay_order_id: orderId },
      {
        payment_status: status,
        ...(paymentId && { razorpay_payment_id: paymentId }),
      },
      { new: true }
    ).exec();
  }
}

export const paymentRepository = new PaymentRepository();
