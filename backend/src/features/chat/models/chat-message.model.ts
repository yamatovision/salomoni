import { Schema, model, Document } from 'mongoose';
import { ChatMessage, MessageType } from '../../../types';

export interface IChatMessage extends Omit<ChatMessage, 'id'>, Document {
  _id: string;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: {
      type: String,
      ref: 'Conversation',
      required: [true, '会話IDは必須です'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: [true, 'メッセージタイプは必須です'],
    },
    content: {
      type: String,
      required: [true, 'メッセージ内容は必須です'],
      trim: true,
      maxlength: [4000, 'メッセージは4000文字以内で入力してください'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        
        // Date型の変換
        if (ret.createdAt) ret.createdAt = new Date(ret.createdAt);
        
        return ret;
      },
    },
  }
);

// インデックス
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });
chatMessageSchema.index({ type: 1, createdAt: -1 });

// システムメッセージの場合、特定のmetadataが必要
chatMessageSchema.pre('validate', function(next) {
  if (this.type === MessageType.SYSTEM && !this.metadata?.systemType) {
    this.metadata = this.metadata || {};
    this.metadata.systemType = 'general';
  }
  next();
});

export const ChatMessageModel = model<IChatMessage>('ChatMessage', chatMessageSchema);