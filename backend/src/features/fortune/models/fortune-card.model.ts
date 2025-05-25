import { Schema, model, Document } from 'mongoose';
import { FortuneCard, FortuneCardCategory, FortuneCardIconTheme, ID } from '../../../types';

export interface FortuneCardDocument extends Document, Omit<FortuneCard, 'id'> {
  _id: ID;
}

const FortuneCardSchema = new Schema<FortuneCardDocument>(
  {
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
    icon: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    shortAdvice: {
      type: String,
      required: true,
    },
    detailAdvice: {
      type: String,
      required: true,
    },
    gradientColors: {
      from: String,
      to: String,
    },
  },
  {
    timestamps: true,
  }
);

// カテゴリ別インデックス
FortuneCardSchema.index({ category: 1 });

// toJSONメソッドのカスタマイズ
FortuneCardSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const FortuneCardModel = model<FortuneCardDocument>('FortuneCard', FortuneCardSchema);