import { Schema, model, Document } from 'mongoose';
import { FieldMapping } from '../../../types';

export interface ImportMappingDocument extends Document {
  _id: string;
  organizationId: string;
  mappingName: string;
  mappings: FieldMapping[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const importMappingSchema = new Schema<ImportMappingDocument>(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    mappingName: {
      type: String,
      required: true,
    },
    mappings: [{
      sourceField: {
        type: String,
        required: true,
      },
      targetField: {
        type: String,
        required: true,
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
      priority: {
        type: String,
        enum: ['standard', 'recommended', 'optional'],
        default: 'standard',
      },
    }],
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'import_mappings',
  }
);

// インデックス
importMappingSchema.index({ organizationId: 1, isDefault: 1 });
importMappingSchema.index({ organizationId: 1, mappingName: 1 }, { unique: true });

// 仮想プロパティ
importMappingSchema.virtual('id').get(function(this: ImportMappingDocument) {
  return this._id.toString();
});

// JSONシリアライズ設定
importMappingSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ImportMappingModel = model<ImportMappingDocument>('ImportMapping', importMappingSchema);