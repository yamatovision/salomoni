import { Schema, model, Document } from 'mongoose';
import { StylistReport as IStylistReport, ID } from '../../../types';

export interface StylistReportDocument extends IStylistReport, Document {
  _id: ID;
}

const stylistReportSchema = new Schema<StylistReportDocument>({
  stylistId: {
    type: String,
    required: true
  },
  reportPeriod: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  totalAppointments: {
    type: Number,
    required: true,
    default: 0
  },
  clientSatisfactionScore: {
    type: Number,
    min: 0,
    max: 100
  },
  revenueGenerated: {
    type: Number,
    min: 0
  },
  fourPillarsAnalysis: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// インデックス
stylistReportSchema.index({ stylistId: 1, 'reportPeriod.start': -1 });
stylistReportSchema.index({ 'reportPeriod.start': -1, 'reportPeriod.end': -1 });

export const StylistReportModel = model<StylistReportDocument>('StylistReport', stylistReportSchema);