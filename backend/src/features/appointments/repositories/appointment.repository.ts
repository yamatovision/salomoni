import { PaginationParams, Appointment, AppointmentStatus } from '../../../types';
import { AppointmentModel, IAppointment } from '../models/appointment.model';
import { logger } from '../../../common/utils/logger';

interface AppointmentFilters {
  organizationId: string;
  status?: AppointmentStatus;
  stylistId?: string;
  clientId?: string;
  from?: Date;
  to?: Date;
}

export class AppointmentRepository {
  /**
   * 予約を作成
   */
  async create(appointmentData: Partial<IAppointment>): Promise<Appointment> {
    logger.info('[AppointmentRepository] Creating appointment', {
      organizationId: appointmentData.organizationId,
      clientId: appointmentData.clientId,
      scheduledAt: appointmentData.scheduledAt,
    });

    try {
      const appointment = new AppointmentModel(appointmentData);
      const savedAppointment = await appointment.save();
      const result = savedAppointment.toJSON() as unknown as Appointment;
      
      logger.info('[AppointmentRepository] Appointment created successfully', {
        appointmentId: result.id,
        status: result.status,
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AppointmentRepository] Failed to create appointment', {
        error: errorMessage,
        appointmentData,
      });
      throw error;
    }
  }

  /**
   * 予約一覧を取得（管理者用）
   */
  async findMany(
    filters: AppointmentFilters,
    pagination: PaginationParams
  ): Promise<{ appointments: Appointment[]; total: number }> {
    logger.info('[AppointmentRepository] Fetching appointments', {
      filters,
      pagination,
    });

    try {
      const query: any = { organizationId: filters.organizationId };

      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.stylistId) {
        query.stylistId = filters.stylistId;
      }
      if (filters.clientId) {
        query.clientId = filters.clientId;
      }
      if (filters.from || filters.to) {
        query.scheduledAt = {};
        if (filters.from) {
          query.scheduledAt.$gte = filters.from;
        }
        if (filters.to) {
          query.scheduledAt.$lte = filters.to;
        }
      }

      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 10;
      const skip = (page - 1) * limit;

      const [appointments, total] = await Promise.all([
        AppointmentModel.find(query)
          .sort({ scheduledAt: 1 })
          .skip(skip)
          .limit(limit),
        AppointmentModel.countDocuments(query),
      ]);

      const results = appointments.map((appointment) => {
        return appointment.toJSON() as unknown as Appointment;
      });

      logger.info('[AppointmentRepository] Appointments fetched successfully', {
        count: results.length,
        total,
      });

      return { appointments: results, total };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AppointmentRepository] Failed to fetch appointments', {
        error: errorMessage,
        filters,
      });
      throw error;
    }
  }

  /**
   * IDで予約を取得
   */
  async findById(id: string): Promise<Appointment | null> {
    logger.info('[AppointmentRepository] Fetching appointment by ID', { id });

    try {
      const appointment = await AppointmentModel.findById(id);
      if (!appointment) {
        logger.warn('[AppointmentRepository] Appointment not found', { id });
        return null;
      }

      const result = appointment.toJSON() as unknown as Appointment;
      logger.info('[AppointmentRepository] Appointment found', {
        appointmentId: result.id,
        status: result.status,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AppointmentRepository] Failed to fetch appointment', {
        error: errorMessage,
        id,
      });
      throw error;
    }
  }

  /**
   * 予約を更新
   */
  async update(id: string, updateData: Partial<IAppointment>): Promise<Appointment | null> {
    logger.info('[AppointmentRepository] Updating appointment', {
      id,
      updateFields: Object.keys(updateData),
    });

    try {
      const appointment = await AppointmentModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!appointment) {
        logger.warn('[AppointmentRepository] Appointment not found for update', { id });
        return null;
      }

      const result = appointment.toJSON() as unknown as Appointment;
      logger.info('[AppointmentRepository] Appointment updated successfully', {
        appointmentId: result.id,
        status: result.status,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AppointmentRepository] Failed to update appointment', {
        error: errorMessage,
        id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * 本日の予約を取得（スタイリスト用）
   */
  async findTodayAppointments(
    organizationId: string,
    stylistId: string
  ): Promise<Appointment[]> {
    logger.info('[AppointmentRepository] Fetching today appointments', {
      organizationId,
      stylistId,
    });

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await AppointmentModel.find({
        organizationId,
        stylistId,
        scheduledAt: {
          $gte: today,
          $lt: tomorrow,
        },
        status: { $nin: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] },
      })
        .sort({ scheduledAt: 1 });

      const results = appointments.map((appointment) => {
        return appointment.toJSON() as unknown as Appointment;
      });

      logger.info('[AppointmentRepository] Today appointments fetched', {
        count: results.length,
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AppointmentRepository] Failed to fetch today appointments', {
        error: errorMessage,
        organizationId,
        stylistId,
      });
      throw error;
    }
  }

  /**
   * 予約の重複をチェック
   */
  async checkOverlap(
    organizationId: string,
    stylistId: string,
    scheduledAt: Date,
    duration: number,
    excludeId?: string
  ): Promise<boolean> {
    logger.info('[AppointmentRepository] Checking appointment overlap', {
      organizationId,
      stylistId,
      scheduledAt,
      duration,
      excludeId,
    });

    try {
      const endTime = new Date(scheduledAt.getTime() + duration * 60000);
      
      const query: any = {
        organizationId,
        stylistId,
        status: { $nin: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] },
        $or: [
          {
            scheduledAt: { $gte: scheduledAt, $lt: endTime },
          },
          {
            $expr: {
              $and: [
                { $lt: ['$scheduledAt', endTime] },
                { $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, scheduledAt] },
              ],
            },
          },
        ],
      };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const overlappingCount = await AppointmentModel.countDocuments(query);
      const hasOverlap = overlappingCount > 0;

      logger.info('[AppointmentRepository] Overlap check completed', {
        hasOverlap,
        overlappingCount,
      });

      return hasOverlap;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AppointmentRepository] Failed to check overlap', {
        error: errorMessage,
        organizationId,
        stylistId,
      });
      throw error;
    }
  }
}