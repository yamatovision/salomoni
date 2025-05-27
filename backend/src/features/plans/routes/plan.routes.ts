import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../../common/middleware/auth';
import rateLimit from 'express-rate-limit';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} from '../controllers/plan.controller';

// 読み取り用のレート制限
const readRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 60, // 最大60回
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// 書き込み用のレート制限
const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // 最大10回
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

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

// プラン一覧取得
// GET /api/superadmin/plans
router.get(
  '/',
  readRateLimit,
  authenticate,
  wrapAuthenticatedHandler(getPlans)
);

// プラン詳細取得
// GET /api/superadmin/plans/:planId
router.get(
  '/:planId',
  readRateLimit,
  authenticate,
  wrapAuthenticatedHandler(getPlanById)
);

// プラン作成（SuperAdmin専用）
// POST /api/superadmin/plans
router.post(
  '/',
  writeRateLimit,
  authenticate,
  wrapAuthenticatedHandler(createPlan)
);

// プラン更新（SuperAdmin専用）
// PUT /api/superadmin/plans/:planId
router.put(
  '/:planId',
  writeRateLimit,
  authenticate,
  wrapAuthenticatedHandler(updatePlan)
);

// プラン削除（SuperAdmin専用）
// DELETE /api/superadmin/plans/:planId
router.delete(
  '/:planId',
  writeRateLimit,
  authenticate,
  wrapAuthenticatedHandler(deletePlan)
);

export default router;