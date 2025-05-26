import mongoose, { Schema, Document } from 'mongoose';
import { Appointment, AppointmentStatus } from '../../../types';

export interface IAppointment extends Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    organizationId: {
      type: String,
      required: [true, '組織IDは必須です'],
      index: true,
    },
    clientId: {
      type: String,
      required: [true, 'クライアントIDは必須です'],
      index: true,
    },
    stylistId: {
      type: String,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, '予約日時は必須です'],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, '所要時間は必須です'],
      min: [15, '所要時間は15分以上である必要があります'],
      max: [480, '所要時間は480分以下である必要があります'],
    },
    services: {
      type: [String],
      required: [true, 'サービスは必須です'],
      validate: {
        validator: function (services: string[]) {
          return services.length > 0;
        },
        message: '少なくとも1つのサービスを選択してください',
      },
    },
    servicemenu: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.SCHEDULED,
      required: true,
    },
    note: {
      type: String,
      maxlength: [1000, '備考は1000文字以下で入力してください'],
    },
    completedAt: {
      type: Date,
    },
    canceledAt: {
      type: Date,
    },
    amount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// インデックス設定
appointmentSchema.index({ organizationId: 1, scheduledAt: 1 });
appointmentSchema.index({ organizationId: 1, clientId: 1 });
appointmentSchema.index({ organizationId: 1, stylistId: 1, scheduledAt: 1 });
appointmentSchema.index({ organizationId: 1, status: 1, scheduledAt: 1 });

// 予約時間の重複チェック
appointmentSchema.pre('save', async function (next) {
  if (this.isModified('scheduledAt') || this.isModified('stylistId') || this.isModified('duration')) {
    if (this.stylistId) {
      const endTime = new Date(this.scheduledAt.getTime() + this.duration * 60000);
      
      const overlappingAppointment = await AppointmentModel.findOne({
        _id: { $ne: this._id },
        organizationId: this.organizationId,
        stylistId: this.stylistId,
        status: { $nin: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] },
        $or: [
          {
            scheduledAt: { $gte: this.scheduledAt, $lt: endTime },
          },
          {
            $expr: {
              $and: [
                { $lt: ['$scheduledAt', endTime] },
                { $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, this.scheduledAt] },
              ],
            },
          },
        ],
      });

      if (overlappingAppointment) {
        throw new Error('指定された時間帯は既に予約が入っています');
      }
    }
  }
  next();
});

// ステータス変更時の処理
appointmentSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === AppointmentStatus.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
    }
    if (this.status === AppointmentStatus.CANCELED && !this.canceledAt) {
      this.canceledAt = new Date();
    }
  }
  next();
});

export const AppointmentModel = mongoose.model<IAppointment>('Appointment', appointmentSchema);