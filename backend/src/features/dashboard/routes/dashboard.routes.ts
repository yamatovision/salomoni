import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../../../common/middleware/auth';
import { authorize } from '../../../common/middleware/auth';
import { UserRole } from '../../../types';

const router = Router();
const dashboardController = new DashboardController();

// すべてのダッシュボードルートは認証が必要
router.use(authenticate);

/**
 * @route   GET /api/admin/dashboard
 * @desc    管理者ダッシュボードデータを取得
 * @access  Admin, Owner, SuperAdmin
 */
router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN),
  dashboardController.getAdminDashboard.bind(dashboardController)
);

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    ダッシュボード統計情報を取得（軽量版）
 * @access  Admin, Owner, SuperAdmin
 */
router.get(
  '/stats',
  authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN),
  dashboardController.getDashboardStats.bind(dashboardController)
);

/**
 * @route   GET /api/admin/dashboard/token-usage-chart
 * @desc    トークン使用状況チャートデータを取得
 * @access  Admin, Owner, SuperAdmin
 */
router.get(
  '/token-usage-chart',
  authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN),
  dashboardController.getTokenUsageChart.bind(dashboardController)
);

/**
 * @route   GET /api/admin/dashboard/subscribe
 * @desc    リアルタイムダッシュボード更新を購読（将来の拡張用）
 * @access  Admin, Owner, SuperAdmin
 */
router.get(
  '/subscribe',
  authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN),
  dashboardController.subscribeToDashboardUpdates.bind(dashboardController)
);

export default router;