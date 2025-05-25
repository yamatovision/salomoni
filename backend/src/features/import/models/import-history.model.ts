import { Schema, model, Document } from 'mongoose';
import { ImportMethod, ImportStatus } from '../../../types';

export interface ImportHistoryDocument extends Document {
  organizationId: string;
  method: ImportMethod;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  importErrors?: string[];
  importedBy: string;
  fileName?: string;
  status: ImportStatus;
  startedAt?: Date;
  completedAt?: Date;
  mapping?: any[];
}

const importHistorySchema = new Schema<ImportHistoryDocument>(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: Object.values(ImportMethod),
      required: true,
    },
    totalRecords: {
      type: Number,
      required: true,
      default: 0,
    },
    successCount: {
      type: Number,
      required: true,
      default: 0,
    },
    failureCount: {
      type: Number,
      required: true,
      default: 0,
    },
    importErrors: {
      type: [String],
      default: [],
    },
    importedBy: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(ImportStatus),
      required: true,
      default: ImportStatus.PENDING,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    mapping: [{
      sourceField: String,
      targetField: String,
      isEnabled: Boolean,
      priority: {
        type: String,
        enum: ['standard', 'recommended', 'optional'],
      },
    }],
  },
  {
    timestamps: true,
    collection: 'import_histories',
  }
);

// インデックス
importHistorySchema.index({ organizationId: 1, createdAt: -1 });
importHistorySchema.index({ status: 1 });
importHistorySchema.index({ method: 1 });

// 仮想プロパティ
importHistorySchema.virtual('id').get(function(this: ImportHistoryDocument) {
  return (this._id as any).toString();
});

// JSONシリアライズ設定
importHistorySchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ImportHistoryModel = model<ImportHistoryDocument>('ImportHistory', importHistorySchema);