import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../../../common/middleware/auth';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import { UserRole } from '../../../types';
import { param, query } from 'express-validator';

const router = Router();
const userController = new UserController();

// 全てのルートで認証が必要
router.use(authenticate);

// 管理者権限が必要
router.use(authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN));

// スタイリストレポート生成
// GET /api/admin/stylists/:id/report
router.get(
  '/:id/report',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('スタイリストIDは必須です'),
    query('startDate')
      .isISO8601()
      .withMessage('startDateは有効なISO8601形式の日付である必要があります'),
    query('endDate')
      .isISO8601()
      .withMessage('endDateは有効なISO8601形式の日付である必要があります')
  ],
  handleValidationErrors,
  userController.getStylistReport
);

export default router;