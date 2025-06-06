import { Schema, model, Document } from 'mongoose';

/**
 * 日柱マスターデータ
 * 事前計算された日付ごとの日柱情報を保存
 */
export interface DayPillarMaster extends Document {
  date: Date;                  // 日付（UTC）
  dateString: string;          // YYYY-MM-DD形式
  heavenlyStem: string;        // 天干
  earthlyBranch: string;       // 地支
  element: string;             // 五行（木・火・土・金・水）
  yinYang: string;             // 陰陽
  ganZhi: string;              // 干支（例：癸巳）
  hiddenStems?: string[];      // 蔵干
  // 追加情報
  dayOfWeek: number;           // 曜日（0:日曜〜6:土曜）
  lunarDate?: {                // 旧暦情報（オプション）
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DayPillarMasterSchema = new Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  dateString: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  heavenlyStem: {
    type: String,
    required: true
  },
  earthlyBranch: {
    type: String,
    required: true
  },
  element: {
    type: String,
    required: true,
    enum: ['木', '火', '土', '金', '水']
  },
  yinYang: {
    type: String,
    required: true,
    enum: ['陽', '陰']
  },
  ganZhi: {
    type: String,
    required: true
  },
  hiddenStems: [{
    type: String
  }],
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  lunarDate: {
    year: Number,
    month: Number,
    day: Number,
    isLeapMonth: Boolean
  }
}, {
  timestamps: true
});

// 複合インデックス
DayPillarMasterSchema.index({ date: 1, dateString: 1 });

export const DayPillarMasterModel = model<DayPillarMaster>('DayPillarMaster', DayPillarMasterSchema);