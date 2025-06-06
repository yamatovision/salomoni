import mongoose, { Document, Schema, Model } from 'mongoose';
import { FourPillarsData } from '../../../types';

// 四柱推命データドキュメントインターフェース
export interface IFourPillarsDataDocument extends Omit<FourPillarsData, '_id' | 'calculatedAt' | 'userId' | 'clientId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  calculatedAt: Date;
}

// 柱データスキーマ
const pillarDataSchema = new Schema({
  heavenlyStem: { type: String, required: true },
  earthlyBranch: { type: String, required: true },
  element: { type: String, required: true },
  yinYang: { type: String, required: true },
}, { _id: false });

// 五行バランススキーマ
const elementBalanceSchema = new Schema({
  wood: { type: Number, required: true },
  fire: { type: Number, required: true },
  earth: { type: Number, required: true },
  metal: { type: Number, required: true },
  water: { type: Number, required: true },
  mainElement: { 
    type: String, 
    enum: ['wood', 'fire', 'earth', 'metal', 'water'],
    required: false 
  },
  isBalanced: { type: Boolean, required: false },
}, { _id: false });

// 十神スキーマ
const tenGodsSchema = new Schema({
  year: { type: String, required: true },
  month: { type: String, required: true },
  day: { type: String, required: true },
  hour: { type: String, required: true },
}, { _id: false });

// 四柱推命データスキーマ定義
const fourPillarsDataSchema = new Schema<IFourPillarsDataDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: false,
      index: true,
    },
    birthDate: {
      type: String,
      required: true,
    },
    birthTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '有効な時刻形式（HH:mm）を入力してください'],
    },
    location: {
      type: new Schema({
        name: { type: String, required: true },
        longitude: { type: Number, required: true },
        latitude: { type: Number, required: true },
      }, { _id: false }),
      required: false,
    },
    timezone: {
      type: String,
      required: true,
      default: 'Asia/Tokyo',
    },
    yearPillar: {
      type: pillarDataSchema,
      required: true,
    },
    monthPillar: {
      type: pillarDataSchema,
      required: true,
    },
    dayPillar: {
      type: pillarDataSchema,
      required: true,
    },
    hourPillar: {
      type: pillarDataSchema,
      required: true,
    },
    elementBalance: {
      type: elementBalanceSchema,
      required: true,
    },
    tenGods: {
      type: tenGodsSchema,
      required: true,
    },
    hiddenStems: {
      type: Schema.Types.Mixed,
      required: false,
    },
    twelveFortunes: {
      type: Schema.Types.Mixed,
      required: false,
    },
    kakukyoku: {
      type: String,
      required: false,
    },
    yojin: {
      type: [String],
      required: false,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        // ObjectIdを文字列に変換
        if (ret.userId) ret.userId = ret.userId.toString();
        if (ret.clientId) ret.clientId = ret.clientId.toString();
        return ret;
      },
    },
  }
);

// インデックス設定
fourPillarsDataSchema.index({ userId: 1 });
fourPillarsDataSchema.index({ clientId: 1 });
fourPillarsDataSchema.index({ calculatedAt: -1 });

// 複合インデックス: ユーザーまたはクライアントごとの最新データを効率的に取得
fourPillarsDataSchema.index({ userId: 1, calculatedAt: -1 });
fourPillarsDataSchema.index({ clientId: 1, calculatedAt: -1 });

// 仮想プロパティ: id
fourPillarsDataSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// スタティックメソッドのインターフェース
interface IFourPillarsDataModel extends Model<IFourPillarsDataDocument> {
  findByUserId(userId: string): Promise<IFourPillarsDataDocument | null>;
  findByClientId(clientId: string): Promise<IFourPillarsDataDocument | null>;
  findLatestByUserId(userId: string): Promise<IFourPillarsDataDocument | null>;
  findLatestByClientId(clientId: string): Promise<IFourPillarsDataDocument | null>;
}

// スタティックメソッド: ユーザーIDで四柱推命データを取得
fourPillarsDataSchema.statics.findByUserId = async function (
  userId: string
): Promise<IFourPillarsDataDocument | null> {
  return this.findOne({ userId }).sort({ calculatedAt: -1 });
};

// スタティックメソッド: クライアントIDで四柱推命データを取得
fourPillarsDataSchema.statics.findByClientId = async function (
  clientId: string
): Promise<IFourPillarsDataDocument | null> {
  return this.findOne({ clientId }).sort({ calculatedAt: -1 });
};

// スタティックメソッド: ユーザーIDで最新の四柱推命データを取得
fourPillarsDataSchema.statics.findLatestByUserId = async function (
  userId: string
): Promise<IFourPillarsDataDocument | null> {
  return this.findOne({ userId }).sort({ calculatedAt: -1 });
};

// スタティックメソッド: クライアントIDで最新の四柱推命データを取得
fourPillarsDataSchema.statics.findLatestByClientId = async function (
  clientId: string
): Promise<IFourPillarsDataDocument | null> {
  return this.findOne({ clientId }).sort({ calculatedAt: -1 });
};

// toJSONメソッドのカスタマイズ
fourPillarsDataSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    delete ret._id;
    delete ret.__v;
    // ObjectIdをstringに変換
    if (ret.userId) {
      ret.userId = ret.userId.toString();
    }
    if (ret.clientId) {
      ret.clientId = ret.clientId.toString();
    }
    return ret;
  },
});

// モデルのエクスポート
export const FourPillarsDataModel: IFourPillarsDataModel = mongoose.model<IFourPillarsDataDocument, IFourPillarsDataModel>(
  'FourPillarsData',
  fourPillarsDataSchema
);