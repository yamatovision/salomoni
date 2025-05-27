import { Schema, model, Document } from 'mongoose';
import { Organization, OrganizationStatus, OrganizationPlan } from '../../../types';

export interface OrganizationDocument extends Document, Omit<Organization, 'id'> {}

const organizationSchema = new Schema<OrganizationDocument>({
  name: {
    type: String,
    required: [true, '組織名は必須です'],
    trim: true,
    maxlength: [100, '組織名は100文字以内で入力してください'],
  },
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, '有効なメールアドレスを入力してください'],
  },
  phone: {
    type: String,
    match: [/^[\d-]+$/, '有効な電話番号を入力してください'],
  },
  address: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(OrganizationStatus),
    default: OrganizationStatus.ACTIVE,
    required: true,
  },
  ownerId: {
    type: String,
    ref: 'User',
    required: [true, 'オーナーIDは必須です'],
  },
  plan: {
    type: String,
    enum: Object.values(OrganizationPlan),
    default: OrganizationPlan.STANDARD,
    required: true,
  },
  settings: {
    allowLineAuth: {
      type: Boolean,
      default: true,
    },
    requireEmailVerification: {
      type: Boolean,
      default: false,
    },
    maxUsers: {
      type: Number,
      default: 10,
    },
    features: {
      aiChat: {
        type: Boolean,
        default: true,
      },
      fourPillars: {
        type: Boolean,
        default: true,
      },
      appointments: {
        type: Boolean,
        default: true,
      },
      clientManagement: {
        type: Boolean,
        default: true,
      },
    },
  },
  metadata: {
    employeeCount: {
      type: Number,
      min: 1,
    },
    businessType: {
      type: String,
      enum: ['salon', 'individual', 'franchise', 'other'],
    },
    established: {
      type: Date,
    },
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      // ObjectIdをstringに変換
      if (ret.ownerId) {
        ret.ownerId = ret.ownerId.toString();
      }
      return ret;
    }
  }
});

// インデックス
// emailはスキーマ定義でunique: trueが設定されているためインデックスは自動作成される
organizationSchema.index({ status: 1 });
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ createdAt: -1 });

// 仮想フィールド
organizationSchema.virtual('isActive').get(function(this: OrganizationDocument) {
  return this.status === OrganizationStatus.ACTIVE;
});

organizationSchema.virtual('isSuspended').get(function(this: OrganizationDocument) {
  return this.status === OrganizationStatus.SUSPENDED;
});

// 静的メソッド
organizationSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

organizationSchema.statics.findActive = function() {
  return this.find({ status: OrganizationStatus.ACTIVE });
};

// インスタンスメソッド
organizationSchema.methods.suspend = async function(reason?: string) {
  this.status = OrganizationStatus.SUSPENDED;
  if (reason) {
    this.metadata = { ...this.metadata, suspensionReason: reason };
  }
  return this.save();
};

organizationSchema.methods.activate = async function() {
  this.status = OrganizationStatus.ACTIVE;
  if (this.metadata?.suspensionReason) {
    delete this.metadata.suspensionReason;
  }
  return this.save();
};

export const OrganizationModel = model<OrganizationDocument>('Organization', organizationSchema);