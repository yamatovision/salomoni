import { Schema, model, Document } from 'mongoose';
import { AICharacter, AICharacterStyle } from '../../../types';

export interface IAICharacter extends Omit<AICharacter, 'id'>, Document {
  _id: string;
}

const aiCharacterSchema = new Schema<IAICharacter>(
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
    name: {
      type: String,
      required: [true, 'AIキャラクター名は必須です'],
      trim: true,
      maxlength: [50, 'AIキャラクター名は50文字以内で入力してください'],
    },
    styleFlags: [{
      type: String,
      enum: Object.values(AICharacterStyle),
    }],
    personalityScore: {
      softness: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      energy: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      formality: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
    },
    lastInteractionAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret): AICharacter => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        
        // Date型の変換
        if (ret.createdAt) ret.createdAt = new Date(ret.createdAt);
        if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt);
        if (ret.lastInteractionAt) ret.lastInteractionAt = new Date(ret.lastInteractionAt);
        
        return ret as AICharacter;
      },
    },
  }
);

// インデックス
aiCharacterSchema.index({ userId: 1, clientId: 1 });
aiCharacterSchema.index({ name: 'text' });

// ユーザーまたはクライアントのいずれか一つは必須
aiCharacterSchema.pre('validate', function(next) {
  if (!this.userId && !this.clientId) {
    next(new Error('userIdまたはclientIdのいずれかは必須です'));
  } else if (this.userId && this.clientId) {
    next(new Error('userIdとclientIdは同時に設定できません'));
  } else {
    next();
  }
});

export const AICharacterModel = model<IAICharacter>('AICharacter', aiCharacterSchema);