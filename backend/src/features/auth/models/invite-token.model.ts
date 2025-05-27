import { Schema, model, Document, Types, Model } from 'mongoose';
import { UserRole } from '../../../types';

export interface InviteTokenDocument extends Document {
  token: string;
  email: string;
  organizationId: Types.ObjectId | string;
  role: UserRole.ADMIN | UserRole.USER;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdBy: Types.ObjectId | string;
  // 追加フィールド
  name?: string;
  birthDate?: Date;
  phone?: string;
  position?: string;
  markAsUsed(): Promise<InviteTokenDocument>;
}

export interface InviteTokenModel extends Model<InviteTokenDocument> {
  findValidToken(token: string): Promise<InviteTokenDocument | null>;
}

const inviteTokenSchema = new Schema<InviteTokenDocument>({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  role: {
    type: String,
    enum: [UserRole.ADMIN, UserRole.USER],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // 追加フィールド
  name: {
    type: String,
    trim: true,
  },
  birthDate: {
    type: Date,
  },
  phone: {
    type: String,
    trim: true,
  },
  position: {
    type: String,
    trim: true,
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
      if (ret.organizationId) {
        ret.organizationId = ret.organizationId.toString();
      }
      if (ret.createdBy) {
        ret.createdBy = ret.createdBy.toString();
      }
      return ret;
    }
  }
});

// インデックス
inviteTokenSchema.index({ email: 1, organizationId: 1 });

// 静的メソッド
inviteTokenSchema.statics.findValidToken = function(token: string) {
  return this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() },
  });
};

// インスタンスメソッド
inviteTokenSchema.methods.markAsUsed = async function() {
  this.used = true;
  this.usedAt = new Date();
  return this.save();
};

export const InviteTokenModel = model<InviteTokenDocument, InviteTokenModel>('InviteToken', inviteTokenSchema);