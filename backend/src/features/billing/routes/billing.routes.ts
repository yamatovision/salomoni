import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../../common/middleware/auth';
import rateLimit from 'express-rate-limit';

// 決済処理用のレート制限
const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // 最大10回
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// サブスクリプション用のレート制限
const subscriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回
  message: 'Too many subscription requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// トークン購入用のレート制限
const tokenPurchaseRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 20, // 最大20回
  message: 'Too many token purchase requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// 一般的な読み取り用のレート制限
const readRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 60, // 最大60回
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
import {
  createPaymentToken,
  createSubscription,
  chargeTokens,
  getBillingSummary,
  getInvoices,
  handleWebhook,
  updateSubscription,
  cancelSubscription,
  getSimulationData
} from '../controllers/billing.controller';

// Type assertion wrapper for authenticated routes
const wrapAuthenticatedHandler = (
  handler: (req: AuthenticatedRequest, res: Response, next?: NextFunction) => Promise<Response | void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // The authenticate middleware ensures req.user exists, so this type assertion is safe
    return handler(req as AuthenticatedRequest, res, next);
  };
};

const router = Router();

// 決済トークン作成 - API 8.1
// POST /api/billing/token
router.post(
  '/token',
  paymentRateLimit,
  authenticate,
  wrapAuthenticatedHandler(createPaymentToken)
);

// サブスクリプション作成 - API 8.2
// POST /api/billing/subscription
router.post(
  '/subscription',
  subscriptionRateLimit,
  authenticate,
  wrapAuthenticatedHandler(createSubscription)
);

// サブスクリプション更新
// PATCH /api/billing/subscription/:subscriptionId
router.patch(
  '/subscription/:subscriptionId',
  paymentRateLimit,
  authenticate,
  wrapAuthenticatedHandler(updateSubscription)
);

// サブスクリプションキャンセル
// DELETE /api/billing/subscription/:subscriptionId
router.delete(
  '/subscription/:subscriptionId',
  subscriptionRateLimit,
  authenticate,
  wrapAuthenticatedHandler(cancelSubscription)
);

// トークンチャージ購入 - API 8.3 (Ownerレベル)
// POST /api/owner/billing/charge-tokens
router.post(
  '/charge-tokens',
  tokenPurchaseRateLimit,
  authenticate,
  wrapAuthenticatedHandler(chargeTokens)
);

// 請求サマリー取得 - API 8.4 (Ownerレベル)
// GET /api/owner/billing/summary
router.get(
  '/summary',
  readRateLimit,
  authenticate,
  wrapAuthenticatedHandler(getBillingSummary)
);

// 請求書一覧取得 - API 8.5 (Ownerレベル)
// GET /api/owner/billing/invoices
router.get(
  '/invoices',
  readRateLimit,
  authenticate,
  wrapAuthenticatedHandler(getInvoices)
);

// Webhook処理（認証不要） 
// POST /api/billing/webhook
router.post(
  '/webhook',
  rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }), // 1分間に100回まで
  handleWebhook
);

// 収益シミュレーションデータ取得（SuperAdmin用）
// GET /api/superadmin/revenue/simulation-data
router.get(
  '/simulation-data',
  readRateLimit,
  authenticate,
  wrapAuthenticatedHandler(getSimulationData)
);

export default router;