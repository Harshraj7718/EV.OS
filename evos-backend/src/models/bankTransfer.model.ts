import { Schema, model, Document } from 'mongoose';
import { IBankTransferSubmission } from '../interfaces/bankTransfer.interface';

export interface IBankTransferDocument extends IBankTransferSubmission, Document {}

const bankTransferSchema = new Schema<IBankTransferDocument>(
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
    invoiceFileName: {
      type: String,
      required: true,
    },
    invoiceFileMimeType: {
      type: String,
      required: true,
    },
    invoiceFileData: {
      type: Buffer,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending_review', 'verified', 'rejected'],
      default: 'pending_review',
    },
  },
  {
    timestamps: true,
    collection: 'bank_transfer_submissions',
  }
);

export const BankTransferModel = model<IBankTransferDocument>(
  'BankTransfer',
  bankTransferSchema
);
