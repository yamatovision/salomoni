import { Schema, model, Document } from 'mongoose';
import { Conversation } from '../../../types';

export interface IConversation extends Omit<Conversation, 'id'>, Document {
  _id: string;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: String,
      ref: 'User',
      index: true,
    },
    clientId: {
      type: String,
      ref: 'Client',
      index: true,
    },
    aiCharacterId: {
      type: String,
      ref: 'AICharacter',
      required: [true, 'AIキャラクターIDは必須です'],
      index: true,
    },
    context: {
      type: String,
      enum: ['personal', 'stylist_consultation', 'client_direct'],
      required: [true, 'コンテキストは必須です'],
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endedAt: {
      type: Date,
    },
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    memoryUpdates: [{
      type: String,
      ref: 'AIMemory',
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        
        // Date型の変換
        if (ret.createdAt) ret.createdAt = new Date(ret.createdAt);
        if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt);
        if (ret.startedAt) ret.startedAt = new Date(ret.startedAt);
        if (ret.endedAt) ret.endedAt = new Date(ret.endedAt);
        
        return ret;
      },
    },
  }
);

// インデックス
conversationSchema.index({ userId: 1, startedAt: -1 });
conversationSchema.index({ clientId: 1, startedAt: -1 });
conversationSchema.index({ aiCharacterId: 1, startedAt: -1 });
conversationSchema.index({ context: 1, startedAt: -1 });

// ユーザーまたはクライアントのいずれか一つは必須
conversationSchema.pre('validate', function(next) {
  if (!this.userId && !this.clientId) {
    next(new Error('userIdまたはclientIdのいずれかは必須です'));
  } else if (this.userId && this.clientId) {
    next(new Error('userIdとclientIdは同時に設定できません'));
  } else {
    next();
  }
});

// コンテキストの整合性チェック
conversationSchema.pre('validate', function(next) {
  if (this.context === 'personal' && !this.userId) {
    next(new Error('personalコンテキストの場合、userIdは必須です'));
  } else if (this.context === 'client_direct' && !this.clientId) {
    next(new Error('client_directコンテキストの場合、clientIdは必須です'));
  } else {
    next();
  }
});

export const ConversationModel = model<IConversation>('Conversation', conversationSchema);