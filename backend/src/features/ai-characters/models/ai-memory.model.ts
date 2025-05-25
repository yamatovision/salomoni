import { Schema, model, Document } from 'mongoose';
import { AIMemory, AIMemoryType } from '../../../types';

export interface IAIMemory extends Omit<AIMemory, 'id'>, Document {
  _id: string;
}

const aiMemorySchema = new Schema<IAIMemory>(
  {
    characterId: {
      type: String,
      ref: 'AICharacter',
      required: [true, 'キャラクターIDは必須です'],
      index: true,
    },
    memoryType: {
      type: String,
      enum: Object.values(AIMemoryType),
      required: [true, 'メモリタイプは必須です'],
    },
    content: {
      type: String,
      required: [true, 'メモリ内容は必須です'],
      trim: true,
      maxlength: [1000, 'メモリ内容は1000文字以内で入力してください'],
    },
    category: {
      type: String,
      required: [true, 'カテゴリは必須です'],
      trim: true,
      enum: ['preference', 'experience', 'relationship', 'goal', 'characteristic', 'other'],
    },
    extractedFrom: {
      type: String,
      trim: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: function(this: IAIMemory) {
        return this.memoryType === AIMemoryType.EXPLICIT ? 100 : 80;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret): AIMemory => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        
        // Date型の変換
        if (ret.createdAt) ret.createdAt = new Date(ret.createdAt);
        if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt);
        
        return ret as AIMemory;
      },
    },
  }
);

// インデックス
aiMemorySchema.index({ characterId: 1, category: 1 });
aiMemorySchema.index({ characterId: 1, isActive: 1 });
aiMemorySchema.index({ content: 'text' });

// 自動抽出タイプの場合、extractedFromは必須
aiMemorySchema.pre('validate', function(next) {
  if (this.memoryType === AIMemoryType.AUTO && !this.extractedFrom) {
    next(new Error('自動抽出タイプの場合、抽出元（extractedFrom）は必須です'));
  } else {
    next();
  }
});

export const AIMemoryModel = model<IAIMemory>('AIMemory', aiMemorySchema);