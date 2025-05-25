import { Schema, model, Document } from 'mongoose';

export interface ImportFileDocument extends Document {
  _id: string;
  fileId: string;
  organizationId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  recordCount: number;
  headers: string[];
  previewData: any[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importFileSchema = new Schema<ImportFileDocument>(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    recordCount: {
      type: Number,
      default: 0,
    },
    headers: {
      type: [String],
      default: [],
    },
    previewData: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'import_files',
  }
);

// TTLインデックス（有効期限切れファイルの自動削除）
importFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 仮想プロパティ
importFileSchema.virtual('id').get(function(this: ImportFileDocument) {
  return this._id.toString();
});

// JSONシリアライズ設定
importFileSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    delete ret.filePath; // セキュリティのためファイルパスは返さない
    return ret;
  },
});

export const ImportFileModel = model<ImportFileDocument>('ImportFile', importFileSchema);