import mongoose, { Document, Schema, Model } from 'mongoose';
import { Client } from '../../../types';

// クライアントドキュメントインターフェース
export interface IClientDocument extends Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
  fourPillarsDataId?: mongoose.Types.ObjectId; // 四柱推命データへの参照
  aiCharacterId?: mongoose.Types.ObjectId; // AIキャラクターへの参照
  updateVisit(): Promise<IClientDocument>; // インスタンスメソッド
}

// クライアントスキーマ定義
const clientSchema = new Schema<IClientDocument>(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: false,
    },
    birthTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '有効な時刻形式（HH:mm）を入力してください'],
      required: false,
    },
    birthLocation: {
      name: String,
      longitude: Number,
      latitude: Number,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: false,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    memo: {
      type: String,
      required: false,
    },
    lastVisitDate: {
      type: Date,
      required: false,
    },
    visitCount: {
      type: Number,
      default: 0,
    },
    fourPillarsDataId: {
      type: Schema.Types.ObjectId,
      ref: 'FourPillarsData',
      required: false,
    },
    aiCharacterId: {
      type: Schema.Types.ObjectId,
      ref: 'AICharacter',
      required: false,
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
        if (ret.organizationId) ret.organizationId = ret.organizationId.toString();
        if (ret.fourPillarsDataId) ret.fourPillarsDataId = ret.fourPillarsDataId.toString();
        if (ret.aiCharacterId) ret.aiCharacterId = ret.aiCharacterId.toString();
        return ret;
      },
    },
  }
);

// インデックス設定
clientSchema.index({ organizationId: 1, email: 1 });
clientSchema.index({ organizationId: 1, phoneNumber: 1 });
clientSchema.index({ organizationId: 1, createdAt: -1 });
clientSchema.index({ organizationId: 1, name: 'text' }); // テキスト検索用

// 仮想プロパティ: id
clientSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// スタティックメソッドのインターフェース
interface IClientModel extends Model<IClientDocument> {
  findDuplicate(
    organizationId: string,
    email?: string,
    phoneNumber?: string,
    excludeId?: string
  ): Promise<IClientDocument | null>;
}

// スタティックメソッド: 組織内でメールアドレスまたは電話番号の重複をチェック
clientSchema.statics.findDuplicate = async function (
  organizationId: string,
  email?: string,
  phoneNumber?: string,
  excludeId?: string
): Promise<IClientDocument | null> {
  const query: any = { organizationId };
  const orConditions = [];

  if (email) {
    orConditions.push({ email });
  }
  if (phoneNumber) {
    orConditions.push({ phoneNumber });
  }

  if (orConditions.length === 0) {
    return null;
  }

  query.$or = orConditions;

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.findOne(query);
};

// インスタンスメソッド: 訪問情報を更新
clientSchema.methods.updateVisit = function () {
  this.lastVisitDate = new Date();
  this.visitCount += 1;
  return this.save();
};

// toJSONメソッドのカスタマイズ
clientSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    delete ret._id;
    delete ret.__v;
    // fourPillarsDataIdをstringに変換
    if (ret.fourPillarsDataId) {
      ret.fourPillarsDataId = ret.fourPillarsDataId.toString();
    }
    return ret;
  },
});

// モデルのエクスポート
export const ClientModel: IClientModel = mongoose.model<IClientDocument, IClientModel>('Client', clientSchema);