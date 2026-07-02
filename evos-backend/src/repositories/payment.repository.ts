import { PaymentModel, IPaymentDocument } from '../models/payment.model';
import { ICreateOrderDto, PaymentStatus } from '../interfaces/payment.interface';

export class PaymentRepository {
  async create(dto: ICreateOrderDto & { razorpay_order_id: string }): Promise<IPaymentDocument> {
    return PaymentModel.create({
      ...dto,
      payment_status: 'created',
    });
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
