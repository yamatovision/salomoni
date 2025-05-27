import mongoose from 'mongoose';

export enum PlanType {
  SUBSCRIPTION = 'subscription',
  TOKEN_PACK = 'token_pack',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ONE_TIME = 'one_time',
}

export interface IPlan extends mongoose.Document {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  limits: {
    stylists?: number;
    clients?: number;
    tokensPerMonth?: number;
  };
  tokenAmount?: number; // トークンパックの場合のトークン数
  isActive: boolean;
  displayOrder: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new mongoose.Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(PlanType),
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    billingCycle: {
      type: String,
      enum: Object.values(BillingCycle),
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    limits: {
      stylists: {
        type: Number,
        min: 0,
      },
      clients: {
        type: Number,
        min: 0,
      },
      tokensPerMonth: {
        type: Number,
        min: 0,
      },
    },
    tokenAmount: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// インデックス
planSchema.index({ type: 1, isActive: 1 });
planSchema.index({ displayOrder: 1 });

// バリデーション
planSchema.pre('save', function (next) {
  // トークンパックの場合はtokenAmountが必須
  if (this.type === PlanType.TOKEN_PACK && !this.tokenAmount) {
    next(new Error('Token amount is required for token pack plans'));
    return;
  }
  
  // サブスクリプションの場合はlimitsが必須
  if (this.type === PlanType.SUBSCRIPTION) {
    if (!this.limits.stylists || !this.limits.clients || !this.limits.tokensPerMonth) {
      next(new Error('Limits are required for subscription plans'));
      return;
    }
  }
  
  next();
});

export const Plan = mongoose.model<IPlan>('Plan', planSchema);