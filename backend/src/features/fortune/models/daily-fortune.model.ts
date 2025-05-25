import { Schema, model, Document } from 'mongoose';
import { DailyFortune, ID } from '../../../types';

export interface DailyFortuneDocument extends Document, Omit<DailyFortune, 'id'> {
  _id: ID;
}

const DailyFortuneSchema = new Schema<DailyFortuneDocument>(
  {
    userId: {
      type: String,
      index: true,
    },
    clientId: {
      type: String,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    overallLuck: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    workLuck: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    relationshipLuck: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    healthLuck: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    luckyColor: {
      type: String,
      required: true,
    },
    luckyDirection: {
      type: String,
      required: true,
    },
    advice: {
      type: String,
      required: true,
    },
    warnings: [String],
  },
  {
    timestamps: true,
  }
);

// 複合インデックス（ユーザー/クライアントと日付の組み合わせは一意）
DailyFortuneSchema.index({ userId: 1, date: 1 }, { unique: true, sparse: true });
DailyFortuneSchema.index({ clientId: 1, date: 1 }, { unique: true, sparse: true });

// toJSONメソッドのカスタマイズ
DailyFortuneSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const DailyFortuneModel = model<DailyFortuneDocument>('DailyFortune', DailyFortuneSchema);