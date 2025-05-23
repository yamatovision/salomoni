import { body, param, query, ValidationChain } from 'express-validator';
import { UserRole } from '../../../types';

// ユーザー招待のバリデーション
export const validateInviteUser: ValidationChain[] = [
  body('email')
    .notEmpty().withMessage('メールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('role')
    .notEmpty().withMessage('ロールは必須です')
    .isIn([UserRole.ADMIN, UserRole.USER]).withMessage('招待可能なロールはAdminまたはUserです'),
  body('name')
    .optional()
    .isLength({ max: 100 }).withMessage('名前は100文字以内で入力してください')
    .trim(),
  body('department')
    .optional()
    .isLength({ max: 50 }).withMessage('部署名は50文字以内で入力してください')
    .trim(),
  body('employeeNumber')
    .optional()
    .isLength({ max: 20 }).withMessage('社員番号は20文字以内で入力してください')
    .trim(),
];

// ユーザー更新のバリデーション
export const validateUpdateUser: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効なユーザーIDを指定してください'),
  body('name')
    .optional()
    .isLength({ max: 100 }).withMessage('名前は100文字以内で入力してください')
    .trim(),
  body('nameKana')
    .optional()
    .isLength({ max: 100 }).withMessage('フリガナは100文字以内で入力してください')
    .trim(),
  body('phone')
    .optional()
    .matches(/^[\d-]+$/).withMessage('有効な電話番号を入力してください'),
  body('birthDate')
    .optional()
    .isISO8601().withMessage('生年月日は有効な日付形式で入力してください'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('有効な性別を指定してください'),
  body('department')
    .optional()
    .isLength({ max: 50 }).withMessage('部署名は50文字以内で入力してください')
    .trim(),
  body('employeeNumber')
    .optional()
    .isLength({ max: 20 }).withMessage('社員番号は20文字以内で入力してください')
    .trim(),
  body('preferences.notifications.email')
    .optional()
    .isBoolean().withMessage('メール通知設定は真偽値で指定してください'),
  body('preferences.notifications.push')
    .optional()
    .isBoolean().withMessage('プッシュ通知設定は真偽値で指定してください'),
  body('preferences.notifications.sms')
    .optional()
    .isBoolean().withMessage('SMS通知設定は真偽値で指定してください'),
  body('preferences.language')
    .optional()
    .isIn(['ja', 'en']).withMessage('有効な言語を指定してください'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto']).withMessage('有効なテーマを指定してください'),
];

// ユーザー一覧取得のバリデーション
export const validateGetUsers: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('ページ番号は1以上の整数で指定してください'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('取得件数は1〜100の範囲で指定してください'),
  query('role')
    .optional()
    .isIn(Object.values(UserRole)).withMessage('有効なロールを指定してください'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('有効なステータスを指定してください'),
  query('organizationId')
    .optional()
    .isMongoId().withMessage('有効な組織IDを指定してください'),
  query('search')
    .optional()
    .isString().withMessage('検索キーワードは文字列で指定してください')
    .trim(),
];

// ユーザーIDのバリデーション
export const validateUserId: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効なユーザーIDを指定してください'),
];

// パスワード変更のバリデーション
export const validateChangePassword: ValidationChain[] = [
  body('currentPassword')
    .notEmpty().withMessage('現在のパスワードは必須です'),
  body('newPassword')
    .notEmpty().withMessage('新しいパスワードは必須です')
    .isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('パスワードは大文字、小文字、数字を含む必要があります')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('新しいパスワードは現在のパスワードと異なる必要があります'),
];

// ロール変更のバリデーション
export const validateChangeRole: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効なユーザーIDを指定してください'),
  body('roles')
    .isArray({ min: 1 }).withMessage('少なくとも1つのロールを指定してください')
    .custom((roles: string[]) => {
      return roles.every(role => Object.values(UserRole).includes(role as UserRole));
    }).withMessage('有効なロールを指定してください'),
];

// ステータス変更のバリデーション
export const validateChangeStatus: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効なユーザーIDを指定してください'),
  body('status')
    .notEmpty().withMessage('ステータスは必須です')
    .isIn(['active', 'inactive', 'suspended']).withMessage('有効なステータスを指定してください'),
  body('reason')
    .optional()
    .isLength({ max: 200 }).withMessage('理由は200文字以内で入力してください')
    .trim(),
];

// 強制ログアウトのバリデーション
export const validateForceLogout: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効なユーザーIDを指定してください'),
  body('reason')
    .optional()
    .isLength({ max: 200 }).withMessage('理由は200文字以内で入力してください')
    .trim(),
];