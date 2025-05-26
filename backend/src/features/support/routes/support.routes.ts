import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { authenticate } from '../../../common/middleware/auth';
import { authorize } from '../../../common/middleware/auth';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import { UserRole } from '../../../types';
import {
  createTicketValidator,
  getTicketsValidator,
  getTicketDetailValidator,
  replyToTicketValidator,
  updateTicketStatusValidator,
  superAdminTicketsValidator
} from '../validators/support.validator';

const router = Router();
const supportController = new SupportController();

// すべてのサポートルートは認証が必要
router.use(authenticate);

// ============================================
// 一般ユーザー・管理者向けルート
// ============================================

/**
 * @route   GET /api/admin/support/stats
 * @desc    サポートチケット統計を取得
 * @access  Admin, Owner, SuperAdmin
 */
router.get(
  '/stats',
  authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN),
  supportController.getTicketStats.bind(supportController)
);

/**
 * @route   POST /api/admin/support/tickets
 * @desc    サポートチケットを作成
 * @access  All authenticated users
 */
router.post(
  '/tickets',
  createTicketValidator,
  handleValidationErrors,
  supportController.createTicket.bind(supportController)
);

/**
 * @route   GET /api/admin/support/tickets
 * @desc    サポートチケット一覧を取得
 * @access  All authenticated users (filtered by role)
 */
router.get(
  '/tickets',
  getTicketsValidator,
  handleValidationErrors,
  supportController.getTickets.bind(supportController)
);

/**
 * @route   GET /api/admin/support/tickets/:ticketId
 * @desc    サポートチケット詳細を取得
 * @access  Ticket owner, Admin, Owner, SuperAdmin
 */
router.get(
  '/tickets/:ticketId',
  getTicketDetailValidator,
  handleValidationErrors,
  supportController.getTicketDetail.bind(supportController)
);

/**
 * @route   POST /api/admin/support/tickets/:ticketId/reply
 * @desc    サポートチケットに返信
 * @access  Ticket owner, Admin, Owner, SuperAdmin
 */
router.post(
  '/tickets/:ticketId/reply',
  replyToTicketValidator,
  handleValidationErrors,
  supportController.replyToTicket.bind(supportController)
);

/**
 * @route   PATCH /api/admin/support/tickets/:ticketId/status
 * @desc    サポートチケットのステータスを更新
 * @access  Admin, Owner, SuperAdmin
 */
router.patch(
  '/tickets/:ticketId/status',
  authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN),
  updateTicketStatusValidator,
  handleValidationErrors,
  supportController.updateTicketStatus.bind(supportController)
);

// ============================================
// SuperAdmin専用ルート
// ============================================

// SuperAdmin用ルーターを作成
const superAdminRouter = Router();

// SuperAdmin認証ミドルウェア
superAdminRouter.use(authenticate);
superAdminRouter.use(authorize(UserRole.SUPER_ADMIN));

/**
 * @route   GET /api/superadmin/support/stats
 * @desc    全組織のサポートチケット統計を取得
 * @access  SuperAdmin only
 */
superAdminRouter.get(
  '/stats',
  supportController.getTicketStats.bind(supportController)
);

/**
 * @route   GET /api/superadmin/support/tickets
 * @desc    全組織のサポートチケット一覧を取得
 * @access  SuperAdmin only
 */
superAdminRouter.get(
  '/tickets',
  superAdminTicketsValidator,
  handleValidationErrors,
  supportController.getSuperAdminTickets.bind(supportController)
);

/**
 * @route   GET /api/superadmin/support/tickets/:ticketId
 * @desc    サポートチケット詳細を取得（SuperAdmin用）
 * @access  SuperAdmin only
 */
superAdminRouter.get(
  '/tickets/:ticketId',
  getTicketDetailValidator,
  handleValidationErrors,
  supportController.getTicketDetail.bind(supportController)
);

/**
 * @route   POST /api/superadmin/support/tickets/:ticketId/reply
 * @desc    サポートチケットに返信（SuperAdmin用）
 * @access  SuperAdmin only
 */
superAdminRouter.post(
  '/tickets/:ticketId/reply',
  replyToTicketValidator,
  handleValidationErrors,
  supportController.superAdminReplyToTicket.bind(supportController)
);

/**
 * @route   PATCH /api/superadmin/support/tickets/:ticketId/status
 * @desc    サポートチケットのステータスを更新（SuperAdmin用）
 * @access  SuperAdmin only
 */
superAdminRouter.patch(
  '/tickets/:ticketId/status',
  updateTicketStatusValidator,
  handleValidationErrors,
  supportController.superAdminUpdateTicketStatus.bind(supportController)
);

export default router;
export { superAdminRouter as superAdminSupportRouter };