import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { 
  validateEmailLogin,
  validateLineLogin,
  validateOrganizationRegistration,
  validateTokenRefresh,
  validatePasswordResetRequest,
  validatePasswordResetComplete,
  validateInviteComplete,
  checkRefreshToken
} from '../validators/auth.validator';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import { authenticate } from '../../../common/middleware/auth';
import { authRateLimiter } from '../../../common/middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// 公開エンドポイント（認証不要）

// メール/パスワードログイン
router.post(
  '/login',
  authRateLimiter,
  validateEmailLogin,
  handleValidationErrors,
  authController.login
);

// LINE認証ログイン（モバイルアプリ専用）
router.post(
  '/login-line',
  authRateLimiter,
  validateLineLogin,
  handleValidationErrors,
  authController.loginLine
);

// LINE認証コールバック（Webフロントエンド専用）
router.post(
  '/line-callback',
  authRateLimiter,
  handleValidationErrors,
  authController.lineCallback
);

// 組織登録（新規オーナー作成）
router.post(
  '/register-organization',
  validateOrganizationRegistration,
  handleValidationErrors,
  authController.registerOrganization
);

// トークンリフレッシュ
router.post(
  '/refresh',
  validateTokenRefresh,
  handleValidationErrors,
  checkRefreshToken,
  authController.refreshToken
);

// 招待トークン検証
router.get(
  '/verify-invite',
  authController.verifyInvite
);

// 招待承認・初回登録完了
router.post(
  '/complete-registration',
  validateInviteComplete,
  handleValidationErrors,
  authController.completeRegistration
);

// パスワードリセットリクエスト
router.post(
  '/password-reset-request',
  authRateLimiter,
  validatePasswordResetRequest,
  handleValidationErrors,
  authController.passwordResetRequest
);

// パスワードリセットトークン検証
router.post(
  '/verify-reset-token',
  authController.verifyResetToken
);

// パスワードリセット完了
router.post(
  '/complete-password-reset',
  validatePasswordResetComplete,
  handleValidationErrors,
  authController.completePasswordReset
);

// 認証が必要なエンドポイント

// ログアウト
router.post(
  '/logout',
  authenticate,
  authController.logout
);

export default router;