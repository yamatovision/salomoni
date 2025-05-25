import mongoose, { Document, Schema } from 'mongoose';
import { ID } from '../../../types/index';

export interface ITokenUsage extends Document {
  _id: ID;
  organizationId: ID;
  userId: ID;
  endpoint: string;
  tokens: number;
  cost: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const tokenUsageSchema = new Schema<ITokenUsage>({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'User',
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  tokens: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false,
  collection: 'token_usage'
});

tokenUsageSchema.index({ organizationId: 1, timestamp: -1 });
tokenUsageSchema.index({ userId: 1, timestamp: -1 });
tokenUsageSchema.index({ timestamp: -1 });

export const TokenUsage = mongoose.model<ITokenUsage>('TokenUsage', tokenUsageSchema);