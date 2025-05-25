import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';
import { PaginationParams, AppointmentStatus } from '../../../types';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  /**
   * 新規予約作成
   * POST /api/appointments
   */
  createAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = req.user!;
      const appointmentData = req.body;

      logger.info('[AppointmentController] Create appointment request', {
        organizationId,
        userId,
        clientId: appointmentData.clientId,
      });

      const appointment = await this.appointmentService.createAppointment(
        organizationId,
        userId,
        appointmentData
      );

      res.status(201).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      logger.error('[AppointmentController] Create appointment failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };

  /**
   * 予約一覧取得（管理者用）
   * GET /api/admin/appointments
   */
  getAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId, currentRole: role } = req.user!;
      const {
        page = '1',
        limit = '20',
        status,
        stylistId,
        clientId,
        from,
        to,
      } = req.query;

      logger.info('[AppointmentController] Get appointments request', {
        organizationId,
        userId,
        role,
        query: req.query,
      });

      const pagination: PaginationParams = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const filters = {
        status: status as AppointmentStatus | undefined,
        stylistId: stylistId as string | undefined,
        clientId: clientId as string | undefined,
        from: from as string | undefined,
        to: to as string | undefined,
      };

      const result = await this.appointmentService.getAppointments(
        organizationId,
        userId,
        role,
        filters,
        pagination
      );

      res.json({
        success: true,
        data: result.appointments,
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (error) {
      logger.error('[AppointmentController] Get appointments failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };

  /**
   * 予約詳細取得
   * GET /api/appointments/:id
   */
  getAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId, currentRole: role } = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new AppError(400, '予約IDが指定されていません');
      }

      logger.info('[AppointmentController] Get appointment detail request', {
        organizationId,
        userId,
        appointmentId: id,
      });

      const appointment = await this.appointmentService.getAppointment(
        organizationId,
        userId,
        role,
        id
      );

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      logger.error('[AppointmentController] Get appointment detail failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };

  /**
   * スタイリスト割当
   * POST /api/appointments/:id/assign
   */
  assignStylist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = req.user!;
      const { id } = req.params;
      const { stylistId } = req.body;

      if (!id) {
        throw new AppError(400, '予約IDが指定されていません');
      }

      logger.info('[AppointmentController] Assign stylist request', {
        organizationId,
        userId,
        appointmentId: id,
        stylistId,
      });

      const appointment = await this.appointmentService.assignStylist(
        organizationId,
        userId,
        id,
        stylistId
      );

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      logger.error('[AppointmentController] Assign stylist failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };

  /**
   * 予約時間変更
   * PUT /api/appointments/:id/move
   */
  moveAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = req.user!;
      const { id } = req.params;
      const { scheduledAt, duration } = req.body;

      if (!id) {
        throw new AppError(400, '予約IDが指定されていません');
      }

      logger.info('[AppointmentController] Move appointment request', {
        organizationId,
        userId,
        appointmentId: id,
        scheduledAt,
        duration,
      });

      const appointment = await this.appointmentService.moveAppointment(
        organizationId,
        userId,
        id,
        scheduledAt,
        duration
      );

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      logger.error('[AppointmentController] Move appointment failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };

  /**
   * カレンダー同期
   * POST /api/appointments/calendar/sync
   */
  syncCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = req.user!;

      logger.info('[AppointmentController] Calendar sync request', {
        organizationId,
        userId,
      });

      const result = await this.appointmentService.syncCalendar(
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('[AppointmentController] Calendar sync failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };
}