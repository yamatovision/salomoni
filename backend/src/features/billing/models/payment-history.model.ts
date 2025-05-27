import mongoose, { Document, Schema } from 'mongoose';
import { ID } from '../../../types/index';

export interface IPaymentHistory extends Document {
  _id: ID;
  organizationId: ID;
  invoiceId: ID;
  amount: number;
  paymentMethodId: ID;
  status: 'success' | 'failed' | 'pending';
  failureReason?: string;
  univapayChargeId?: string;
  univapayTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentHistorySchema = new Schema<IPaymentHistory>({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true,
    index: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'Invoice',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'PaymentMethod',
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    required: true,
    index: true
  },
  failureReason: {
    type: String
  },
  univapayChargeId: {
    type: String,
    sparse: true
  },
  univapayTransactionId: {
    type: String,
    sparse: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'payment_history'
});

paymentHistorySchema.index({ organizationId: 1, createdAt: -1 });
paymentHistorySchema.index({ invoiceId: 1 });
paymentHistorySchema.index({ status: 1, createdAt: -1 });
paymentHistorySchema.index({ univapayChargeId: 1 }, { unique: true, sparse: true });

export const PaymentHistory = mongoose.model<IPaymentHistory>('PaymentHistory', paymentHistorySchema);