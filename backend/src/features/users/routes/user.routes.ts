import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import {
  validateGetUsers,
  validateUserId,
  validateUpdateUser,
  validateInviteUser,
  validateChangePassword,
  validateChangeStatus,
  validateChangeRole,
  validateForceLogout
} from '../validators/user.validator';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import { authenticate, authorize } from '../../../common/middleware/auth';
import { UserRole } from '../../../types';

const router = Router();
const userController = new UserController();

// 全てのルートで認証が必要
router.use(authenticate);

// 現在のユーザー情報取得
router.get(
  '/me',
  userController.getCurrentUser
);

// パスワード変更（自分のみ）
router.post(
  '/me/password',
  validateChangePassword,
  handleValidationErrors,
  userController.changePassword
);

// ユーザー招待（Owner/Admin）
router.post(
  '/invite',
  authorize(UserRole.OWNER, UserRole.ADMIN),
  validateInviteUser,
  handleValidationErrors,
  userController.inviteUser
);

// ユーザー一覧取得（Owner/Admin/SuperAdmin）
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  validateGetUsers,
  handleValidationErrors,
  userController.getUsers
);

// ユーザー詳細取得
router.get(
  '/:id',
  validateUserId,
  handleValidationErrors,
  userController.getUser
);

// ユーザー更新（自分自身または管理権限）
router.put(
  '/:id',
  validateUpdateUser,
  handleValidationErrors,
  userController.updateUser
);

// ユーザー削除（Owner/Admin/SuperAdmin）
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  validateUserId,
  handleValidationErrors,
  userController.deleteUser
);

// ユーザーステータス変更（Owner/Admin/SuperAdmin）
router.patch(
  '/:id/status',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  validateChangeStatus,
  handleValidationErrors,
  userController.changeUserStatus
);

// ユーザーロール変更（Owner/SuperAdmin）
router.patch(
  '/:id/roles',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER),
  validateChangeRole,
  handleValidationErrors,
  userController.changeUserRoles
);

// 強制ログアウト（Owner/Admin/SuperAdmin）
router.post(
  '/:id/force-logout',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  validateForceLogout,
  handleValidationErrors,
  userController.forceLogout
);

// トークン使用量取得
router.get(
  '/:id/token-usage',
  validateUserId,
  handleValidationErrors,
  userController.getTokenUsage
);

export default router;