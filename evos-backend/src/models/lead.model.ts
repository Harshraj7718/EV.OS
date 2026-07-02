import { Schema, model, Document } from 'mongoose';
import { ILead } from '../interfaces/lead.interface';

export interface ILeadDocument extends ILead, Document {}

const leadSchema = new Schema<ILeadDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
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
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    interest: {
      type: String,
      required: [true, 'Interest is required'],
      enum: ['Investor', 'Rider', 'Business', 'Other'],
    },
    budget: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'lead_submissions',
  }
);

leadSchema.index({ createdAt: -1 });

export const LeadModel = model<ILeadDocument>('Lead', leadSchema);
