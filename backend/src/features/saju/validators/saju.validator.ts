import { body, ValidationChain } from 'express-validator';

/**
 * 四柱推命計算のバリデーション
 */
export const validateCalculate: ValidationChain[] = [
  body('birthDate')
    .notEmpty().withMessage('生年月日は必須です')
    .isISO8601().withMessage('生年月日の形式が正しくありません'),
  
  body('birthTime')
    .notEmpty().withMessage('生時は必須です')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('生時の形式は HH:MM である必要があります'),
  
  body('timezone')
    .optional()
    .isString().withMessage('タイムゾーンは文字列である必要があります'),
  
  body('location')
    .optional()
    .isObject().withMessage('位置情報はオブジェクトである必要があります'),
  
  body('location.name')
    .optional()
    .isString().withMessage('地名は文字列である必要があります'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('経度は-180から180の間である必要があります'),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('緯度は-90から90の間である必要があります')
];

/**
 * 追加分析のバリデーション
 */
export const validateAnalyze: ValidationChain[] = [
  body('fourPillarsId')
    .notEmpty().withMessage('四柱推命IDは必須です')
    .isMongoId().withMessage('四柱推命IDの形式が正しくありません'),
  
  body('analysisType')
    .notEmpty().withMessage('分析タイプは必須です')
    .isIn(['personality', 'career', 'health', 'yearly_fortune'])
    .withMessage('分析タイプが正しくありません'),
  
  body('options')
    .optional()
    .isObject().withMessage('オプションはオブジェクトである必要があります')
];

/**
 * 相性診断のバリデーション
 */
export const validateCompatibility: ValidationChain[] = [
  body('users')
    .notEmpty().withMessage('ユーザー情報は必須です')
    .isArray({ min: 2, max: 2 }).withMessage('相性診断は2人分のデータが必要です'),
  
  body('users.*.userId')
    .notEmpty().withMessage('ユーザーIDは必須です')
    .isMongoId().withMessage('ユーザーIDの形式が正しくありません'),
  
  body('users.*.birthDate')
    .notEmpty().withMessage('生年月日は必須です')
    .isISO8601().withMessage('生年月日の形式が正しくありません'),
  
  body('users.*.birthTime')
    .notEmpty().withMessage('生時は必須です')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('生時の形式は HH:MM である必要があります'),
  
  body('users.*.timezone')
    .optional()
    .isString().withMessage('タイムゾーンは文字列である必要があります')
];