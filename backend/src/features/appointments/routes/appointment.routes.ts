import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate, authorize } from '../../../common/middleware/auth';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import {
  createAppointmentValidator,
  getAppointmentsValidator,
  appointmentIdValidator,
  assignStylistValidator,
  moveAppointmentValidator,
} from '../validators/appointment.validator';
import { UserRole } from '../../../types';

const router = Router();
const appointmentController = new AppointmentController();

// 全てのルートで認証が必要
router.use(authenticate);

// 新規予約作成（管理者・オーナー）
router.post(
  '/',
  authorize(UserRole.OWNER, UserRole.ADMIN),
  ...createAppointmentValidator,
  handleValidationErrors,
  appointmentController.createAppointment
);

// 予約詳細取得（全ロール）
router.get(
  '/:id',
  ...appointmentIdValidator,
  handleValidationErrors,
  appointmentController.getAppointment
);

// スタイリスト割当（管理者・オーナー）
router.post(
  '/:id/assign',
  authorize(UserRole.OWNER, UserRole.ADMIN),
  ...assignStylistValidator,
  handleValidationErrors,
  appointmentController.assignStylist
);

// 予約時間変更（管理者・オーナー）
router.put(
  '/:id/move',
  authorize(UserRole.OWNER, UserRole.ADMIN),
  ...moveAppointmentValidator,
  handleValidationErrors,
  appointmentController.moveAppointment
);

// カレンダー同期（管理者・オーナー）
router.post(
  '/calendar/sync',
  authorize(UserRole.OWNER, UserRole.ADMIN),
  appointmentController.syncCalendar
);

// 管理者用ルート
const adminRouter = Router();
adminRouter.use(authenticate);

// 予約一覧取得（管理者・オーナー・スタイリスト）
adminRouter.get(
  '/appointments',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.USER),
  ...getAppointmentsValidator,
  handleValidationErrors,
  appointmentController.getAppointments
);

export { router as appointmentRoutes, adminRouter as adminAppointmentRoutes };