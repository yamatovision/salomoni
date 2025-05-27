import { Router } from 'express';
import { authenticate, authorize } from '../../../common/middleware/auth';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import { superAdminBillingController } from '../controllers/superadmin-billing.controller';
import {
  validateBillingSummaryQuery,
  validateInvoiceListQuery,
  validateInvoiceIdParam,
  validateInvoiceUpdate
} from '../validators/superadmin-billing.validator';
import { UserRole } from '../../../types/index';

const router = Router();

// SuperAdminのみアクセス可能
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN));

// 請求サマリー取得
router.get(
  '/summary',
  validateBillingSummaryQuery,
  handleValidationErrors,
  superAdminBillingController.getBillingSummary.bind(superAdminBillingController)
);

// 請求書一覧取得
router.get(
  '/invoices',
  validateInvoiceListQuery,
  handleValidationErrors,
  superAdminBillingController.getInvoiceList.bind(superAdminBillingController)
);

// 請求書詳細取得
router.get(
  '/invoices/:invoiceId',
  validateInvoiceIdParam,
  handleValidationErrors,
  superAdminBillingController.getInvoiceDetail.bind(superAdminBillingController)
);

// 請求書更新（Phase 3で実装）
router.patch(
  '/invoices/:invoiceId',
  validateInvoiceIdParam,
  validateInvoiceUpdate,
  handleValidationErrors,
  superAdminBillingController.updateInvoice.bind(superAdminBillingController)
);

// 請求書再送信（Phase 3で実装）
router.post(
  '/invoices/:invoiceId/resend',
  validateInvoiceIdParam,
  handleValidationErrors,
  superAdminBillingController.resendInvoice.bind(superAdminBillingController)
);

export default router;