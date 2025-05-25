import { Schema, model, Document } from 'mongoose';
import { DailyAdviceData, ID, FortuneCardCategory, FortuneCardIconTheme } from '../../../types';

export interface DailyAdviceDocument extends Document, Omit<DailyAdviceData, 'id' | 'cards'> {
  _id: ID;
  cards: Array<{
    id: ID;
    category: FortuneCardCategory;
    iconTheme: FortuneCardIconTheme;
    icon: string;
    title: string;
    shortAdvice: string;
    detailAdvice: string;
    gradientColors?: {
      from: string;
      to: string;
    };
  }>;
}

const DailyAdviceSchema = new Schema<DailyAdviceDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    aiCharacterName: {
      type: String,
      required: true,
    },
    aiCharacterAvatar: String,
    greetingMessage: {
      type: String,
      required: true,
    },
    cards: [
      {
        id: { type: String, required: true },
        category: {
          type: String,
          required: true,
          enum: Object.values(FortuneCardCategory),
        },
        iconTheme: {
          type: String,
          required: true,
          enum: Object.values(FortuneCardIconTheme),
        },
        icon: { type: String, required: true },
        title: { type: String, required: true },
        shortAdvice: { type: String, required: true },
        detailAdvice: { type: String, required: true },
        gradientColors: {
          from: String,
          to: String,
        },
      },
    ],
    compatibleStylist: {
      stylistId: String,
      stylistName: String,
      compatibilityScore: {
        type: Number,
        min: 1,
        max: 5,
      },
      reason: String,
      collaborationAdvice: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 複合インデックス（ユーザーと日付の組み合わせは一意）
DailyAdviceSchema.index({ userId: 1, date: 1 }, { unique: true });

// 有効期限に基づくTTLインデックス（30日後に自動削除）
DailyAdviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// toJSONメソッドのカスタマイズ
DailyAdviceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const DailyAdviceModel = model<DailyAdviceDocument>('DailyAdvice', DailyAdviceSchema);