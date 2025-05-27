import mongoose, { Document, Schema } from 'mongoose';
import { ID, OrganizationPlan, SubscriptionStatus } from '../../../types/index';

export interface ISubscription extends Document {
  _id: ID;
  organizationId: ID;
  plan: OrganizationPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  univapaySubscriptionId?: string;
  trialEndsAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: Object.values(OrganizationPlan),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.ACTIVE,
    required: true
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  univapaySubscriptionId: {
    type: String,
    sparse: true
  },
  trialEndsAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'subscriptions'
});

subscriptionSchema.index({ organizationId: 1, status: 1 });
subscriptionSchema.index({ univapaySubscriptionId: 1 }, { unique: true, sparse: true });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);