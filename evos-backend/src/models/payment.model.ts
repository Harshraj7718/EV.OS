import { Schema, model, Document } from 'mongoose';
import { IPayment } from '../interfaces/payment.interface';

export interface IPaymentDocument extends IPayment, Document {}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      required: [true, 'Plan is required'],
      enum: ['Starter', 'Growth', 'Enterprise', 'Custom'],
    },
    investmentAmount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: 1,
    },
    razorpay_order_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpay_payment_id: {
      type: String,
      default: '',
    },
    payment_status: {
      type: String,
      required: true,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

export const PaymentModel = model<IPaymentDocument>('Payment', paymentSchema);
