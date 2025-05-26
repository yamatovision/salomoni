import mongoose, { Schema, Document } from 'mongoose';
import { TicketStatus } from '../../../types';

// サポートチケットのドキュメント型定義
export interface ISupportTicket extends Document {
  ticketNumber: string;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assignedTo?: mongoose.Types.ObjectId;
  lastResponseAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// サポートメッセージのサブドキュメント型定義
export interface ISupportMessage {
  id: string;
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: 'user' | 'admin' | 'system';
  content: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// サポートメッセージのスキーマ定義
const SupportMessageSchema = new Schema<ISupportMessage>({
  ticketId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'SupportTicket'
  },
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  senderType: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'system']
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: String
  }]
}, {
  timestamps: true
});

// サポートチケットのスキーマ定義
const SupportTicketSchema = new Schema<ISupportTicket>({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Organization',
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(TicketStatus),
    default: TicketStatus.OPEN,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastResponseAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'support_tickets'
});

// インデックスの設定
SupportTicketSchema.index({ organizationId: 1, status: 1 });
SupportTicketSchema.index({ userId: 1, createdAt: -1 });
SupportTicketSchema.index({ ticketNumber: 1 });
SupportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });

// 仮想プロパティ: メッセージ数
SupportTicketSchema.virtual('messageCount', {
  ref: 'SupportMessage',
  localField: '_id',
  foreignField: 'ticketId',
  count: true
});

// 仮想プロパティ: メッセージ
SupportTicketSchema.virtual('messages', {
  ref: 'SupportMessage',
  localField: '_id',
  foreignField: 'ticketId'
});

// ステータス更新時の処理
SupportTicketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === TicketStatus.RESOLVED && !this.resolvedAt) {
      this.resolvedAt = new Date();
    } else if (this.status !== TicketStatus.RESOLVED) {
      this.resolvedAt = undefined;
    }
  }
  next();
});

// toJSON設定
SupportTicketSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

SupportMessageSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// モデルのエクスポート
export const SupportTicketModel = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
export const SupportMessageModel = mongoose.model<ISupportMessage>('SupportMessage', SupportMessageSchema);