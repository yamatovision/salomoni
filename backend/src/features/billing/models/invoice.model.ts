import mongoose, { Document, Schema } from 'mongoose';
import { ID, InvoiceStatus, InvoiceItem } from '../../../types/index';

export interface IInvoice extends Document {
  _id: ID;
  invoiceNumber: string;
  organizationId: ID;
  subscriptionId?: ID;
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  billingPeriod?: { start: Date; end: Date };
  type: 'subscription' | 'one-time' | 'token';
  paymentMethodId?: ID;
  univapayChargeId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const invoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true,
    index: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'Subscription',
    index: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAt: {
    type: Date
  },
  status: {
    type: String,
    enum: Object.values(InvoiceStatus),
    default: InvoiceStatus.DRAFT,
    required: true
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  billingPeriod: {
    start: { type: Date },
    end: { type: Date }
  },
  type: {
    type: String,
    enum: ['subscription', 'one-time', 'token'],
    required: true
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'PaymentMethod'
  },
  univapayChargeId: {
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
  collection: 'invoices'
});

invoiceSchema.index({ organizationId: 1, status: 1 });
invoiceSchema.index({ subscriptionId: 1 });
invoiceSchema.index({ issueDate: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ univapayChargeId: 1 }, { unique: true, sparse: true });

invoiceSchema.pre('save', function(next) {
  const doc = this;
  if (!doc.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    doc.invoiceNumber = `INV-${year}${month}${day}-${random}`;
  }
  next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);