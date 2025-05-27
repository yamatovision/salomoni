import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import {
  validateCreateOrganizationWithOwner,
  validateGetOrganizations,
  validateOrganizationId,
  validateUpdateOrganization,
  validateOrganizationStats,
  validateChangePlan
} from '../validators/organization.validator';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import { authenticate, authorize, checkOrganizationAccess } from '../../../common/middleware/auth';
import { UserRole } from '../../../types';

const router = Router();
const organizationController = new OrganizationController();

// 全てのルートで認証が必要
router.use(authenticate);

// 組織とオーナー同時作成（SuperAdminのみ）
router.post(
  '/create-with-owner',
  authorize(UserRole.SUPER_ADMIN),
  validateCreateOrganizationWithOwner,
  handleValidationErrors,
  organizationController.createOrganizationWithOwner
);

// 組織一覧取得（SuperAdminのみ）
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN),
  validateGetOrganizations,
  handleValidationErrors,
  organizationController.getOrganizations
);

// 組織詳細取得（SuperAdmin、または自組織のOwner/Admin）
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  checkOrganizationAccess,
  validateOrganizationId,
  handleValidationErrors,
  organizationController.getOrganization
);

// 組織統計情報取得（SuperAdmin、または自組織のOwner/Admin）
router.get(
  '/:id/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  checkOrganizationAccess,
  validateOrganizationStats,
  handleValidationErrors,
  organizationController.getOrganizationStats
);

// 組織更新（SuperAdmin、または自組織のOwner）
router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER),
  checkOrganizationAccess,
  validateUpdateOrganization,
  handleValidationErrors,
  organizationController.updateOrganization
);

// 組織ステータス変更（SuperAdminのみ）
router.patch(
  '/:id/status',
  authorize(UserRole.SUPER_ADMIN),
  validateOrganizationId,
  handleValidationErrors,
  organizationController.changeOrganizationStatus
);

// 組織プラン変更（SuperAdmin、または自組織のOwner）
router.patch(
  '/:id/plan',
  authorize(UserRole.SUPER_ADMIN, UserRole.OWNER),
  checkOrganizationAccess,
  validateChangePlan,
  handleValidationErrors,
  organizationController.changeOrganizationPlan
);

// 組織削除（SuperAdminのみ）
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  validateOrganizationId,
  handleValidationErrors,
  organizationController.deleteOrganization
);

export default router;