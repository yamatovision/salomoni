import mongoose, { Document, Schema } from 'mongoose';
import { ID, PaymentMethodType } from '../../../types/index';

export interface IPaymentMethod extends Document {
  _id: ID;
  organizationId: ID;
  type: PaymentMethodType;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  isDefault: boolean;
  univapayTokenId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit_card', 'bank_transfer'],
    required: true
  },
  last4: {
    type: String,
    length: 4
  },
  expiryMonth: {
    type: Number,
    min: 1,
    max: 12
  },
  expiryYear: {
    type: Number,
    min: 2024
  },
  brand: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'jcb', 'diners']
  },
  isDefault: {
    type: Boolean,
    default: false,
    required: true
  },
  univapayTokenId: {
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
  collection: 'payment_methods'
});

paymentMethodSchema.index({ organizationId: 1, isDefault: 1 });
paymentMethodSchema.index({ univapayTokenId: 1 }, { unique: true, sparse: true });

paymentMethodSchema.pre('save', async function(next) {
  const doc = this as IPaymentMethod;
  if (doc.isDefault) {
    await PaymentMethod.updateMany(
      { organizationId: doc.organizationId, _id: { $ne: doc._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);