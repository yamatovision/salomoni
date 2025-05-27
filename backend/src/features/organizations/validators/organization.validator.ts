import { body, param, query, ValidationChain } from 'express-validator';
import { OrganizationPlan, OrganizationStatus } from '../../../types';

// 組織とオーナー同時作成のバリデーション（SuperAdmin用）
export const validateCreateOrganizationWithOwner: ValidationChain[] = [
  body('name')
    .notEmpty().withMessage('組織名は必須です')
    .isLength({ max: 100 }).withMessage('組織名は100文字以内で入力してください')
    .trim(),
  body('ownerName')
    .notEmpty().withMessage('オーナー名は必須です')
    .isLength({ max: 100 }).withMessage('オーナー名は100文字以内で入力してください')
    .trim(),
  body('ownerEmail')
    .notEmpty().withMessage('オーナーメールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('ownerPassword')
    .notEmpty().withMessage('パスワードは必須です')
    .isLength({ min: 8 }).withMessage('パスワードは8文字以上で設定してください'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[\d-]+$/).withMessage('有効な電話番号を入力してください'),
  body('address')
    .optional()
    .trim(),
  body('plan')
    .notEmpty().withMessage('プランは必須です')
    .isIn(Object.values(OrganizationPlan)).withMessage('有効なプランを指定してください'),
  body('status')
    .optional()
    .isIn(Object.values(OrganizationStatus)).withMessage('有効なステータスを指定してください'),
  body('tokenLimit')
    .optional()
    .isInt({ min: 0 }).withMessage('トークン上限は0以上の整数で入力してください'),
];


// 組織更新のバリデーション
export const validateUpdateOrganization: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効な組織IDを指定してください'),
  body('name')
    .optional()
    .isLength({ max: 100 }).withMessage('組織名は100文字以内で入力してください')
    .trim(),
  body('email')
    .optional()
    .isEmail().withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^[\d-]+$/).withMessage('有効な電話番号を入力してください'),
  body('address')
    .optional()
    .trim(),
  body('settings.maxUsers')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('最大ユーザー数は1〜1000の範囲で指定してください'),
  body('settings.features.aiChat')
    .optional()
    .isBoolean().withMessage('AIチャット機能の有効/無効は真偽値で指定してください'),
  body('settings.features.fourPillars')
    .optional()
    .isBoolean().withMessage('四柱推命機能の有効/無効は真偽値で指定してください'),
  body('settings.features.appointments')
    .optional()
    .isBoolean().withMessage('予約機能の有効/無効は真偽値で指定してください'),
  body('settings.features.clientManagement')
    .optional()
    .isBoolean().withMessage('顧客管理機能の有効/無効は真偽値で指定してください'),
];

// 組織一覧取得のバリデーション
export const validateGetOrganizations: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('ページ番号は1以上の整数で指定してください'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('取得件数は1〜100の範囲で指定してください'),
  query('status')
    .optional()
    .isIn(['active', 'suspended', 'inactive']).withMessage('有効なステータスを指定してください'),
  query('plan')
    .optional()
    .isIn(Object.values(OrganizationPlan)).withMessage('有効なプランを指定してください'),
  query('search')
    .optional()
    .isString().withMessage('検索キーワードは文字列で指定してください')
    .trim(),
];

// 組織IDのバリデーション
export const validateOrganizationId: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効な組織IDを指定してください'),
];

// 組織統計取得のバリデーション
export const validateOrganizationStats: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効な組織IDを指定してください'),
  query('from')
    .optional()
    .isISO8601().withMessage('開始日は有効な日付形式で指定してください'),
  query('to')
    .optional()
    .isISO8601().withMessage('終了日は有効な日付形式で指定してください'),
];

// プラン変更のバリデーション
export const validateChangePlan: ValidationChain[] = [
  param('id')
    .isMongoId().withMessage('有効な組織IDを指定してください'),
  body('plan')
    .notEmpty().withMessage('プランは必須です')
    .isIn(Object.values(OrganizationPlan)).withMessage('有効なプランを指定してください'),
  body('immediate')
    .optional()
    .isBoolean().withMessage('即時適用フラグは真偽値で指定してください'),
];