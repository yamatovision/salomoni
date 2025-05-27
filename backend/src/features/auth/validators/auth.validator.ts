import { body, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AuthMethod } from '../../../types';

// メールログインのバリデーション
export const validateEmailLogin: ValidationChain[] = [
  body('email')
    .notEmpty().withMessage('メールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('パスワードは必須です')
    .isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください'),
  body('method')
    .equals(AuthMethod.EMAIL).withMessage('認証方法が正しくありません'),
  body('platform')
    .optional()
    .isIn(['mobile', 'web']).withMessage('プラットフォームはmobileまたはwebを指定してください'),
  body('rememberMe')
    .optional()
    .isBoolean().withMessage('ログイン維持オプションは真偽値で指定してください'),
];

// LINE認証のバリデーション
export const validateLineLogin: ValidationChain[] = [
  body('token')
    .notEmpty().withMessage('LINE認証トークンは必須です')
    .isString().withMessage('LINE認証トークンは文字列で指定してください'),
  body('method')
    .equals(AuthMethod.LINE).withMessage('認証方法が正しくありません'),
  body('platform')
    .equals('mobile').withMessage('LINE認証はモバイルアプリでのみ利用可能です'),
];

// 組織登録のバリデーション
export const validateOrganizationRegistration: ValidationChain[] = [
  // 組織情報
  body('organization.name')
    .notEmpty().withMessage('組織名は必須です')
    .isLength({ max: 100 }).withMessage('組織名は100文字以内で入力してください')
    .trim(),
  body('organization.email')
    .notEmpty().withMessage('組織メールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('organization.phone')
    .notEmpty().withMessage('電話番号は必須です')
    .matches(/^[\d-]+$/).withMessage('有効な電話番号を入力してください'),
  body('organization.address')
    .notEmpty().withMessage('住所は必須です')
    .trim(),
  
  // オーナー情報
  body('owner.name')
    .notEmpty().withMessage('オーナー名は必須です')
    .isLength({ max: 100 }).withMessage('オーナー名は100文字以内で入力してください')
    .trim(),
  body('owner.email')
    .notEmpty().withMessage('オーナーメールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('owner.password')
    .notEmpty().withMessage('パスワードは必須です')
    .isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('パスワードは大文字、小文字、数字を含む必要があります'),
  body('owner.phone')
    .optional()
    .matches(/^[\d-]+$/).withMessage('有効な電話番号を入力してください'),
];

// トークンリフレッシュのバリデーション
export const validateTokenRefresh: ValidationChain[] = [
  // refreshTokenはoptionalにして、コントローラーでCookieもチェック
  body('refreshToken')
    .optional()
    .isJWT().withMessage('有効なリフレッシュトークンを指定してください'),
];

// カスタムミドルウェア：Cookieまたはボディからリフレッシュトークンを確認
export const checkRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    res.status(400).json({
      success: false,
      error: 'リフレッシュトークンは必須です',
      code: 'AUTH001'
    });
    return;
  }
  next();
};

// パスワードリセットリクエストのバリデーション
export const validatePasswordResetRequest: ValidationChain[] = [
  body('email')
    .notEmpty().withMessage('メールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
];

// パスワードリセット完了のバリデーション
export const validatePasswordResetComplete: ValidationChain[] = [
  body('token')
    .notEmpty().withMessage('リセットトークンは必須です')
    .isString().withMessage('リセットトークンは文字列で指定してください'),
  body('newPassword')
    .notEmpty().withMessage('新しいパスワードは必須です')
    .isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('パスワードは大文字、小文字、数字を含む必要があります'),
];

// 招待承認のバリデーション
export const validateInviteComplete: ValidationChain[] = [
  body('token')
    .notEmpty().withMessage('招待トークンは必須です')
    .isString().withMessage('招待トークンは文字列で指定してください'),
  body('name')
    .notEmpty().withMessage('名前は必須です')
    .isLength({ max: 100 }).withMessage('名前は100文字以内で入力してください')
    .trim(),
  body('password')
    .notEmpty().withMessage('パスワードは必須です')
    .isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('パスワードは大文字、小文字、数字を含む必要があります'),
  body('birthDate')
    .optional()
    .isISO8601().withMessage('生年月日は有効な日付形式で入力してください'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('性別の値が正しくありません'),
];