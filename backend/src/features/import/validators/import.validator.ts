import { body, query, param, ValidationChain } from 'express-validator';
import { ImportMethod, ImportStatus } from '../../../types';

// CSVファイルアップロードのバリデーション
// ファイルアップロードは multipart/form-data なので、
// ファイル自体の検証は uploadMiddleware で行われる
export const validateImportUpload: ValidationChain[] = [];

// インポート実行のバリデーション
export const validateImportExecute: ValidationChain[] = [
  body('fileId')
    .notEmpty()
    .withMessage('ファイルIDは必須です')
    .isString()
    .withMessage('ファイルIDは文字列である必要があります'),
  body('mapping')
    .isArray()
    .withMessage('マッピングは配列である必要があります')
    .notEmpty()
    .withMessage('マッピングは必須です'),
  body('mapping.*.sourceField')
    .isString()
    .withMessage('ソースフィールドは文字列である必要があります'),
  body('mapping.*.targetField')
    .isString()
    .withMessage('ターゲットフィールドは文字列である必要があります'),
  body('mapping.*.isEnabled')
    .isBoolean()
    .withMessage('有効フラグはブール値である必要があります'),
  body('mapping.*.priority')
    .isIn(['standard', 'recommended', 'optional'])
    .withMessage('優先度は standard, recommended, optional のいずれかである必要があります'),
  body('options')
    .isObject()
    .withMessage('オプションはオブジェクトである必要があります'),
  body('options.autoCreateClients')
    .optional()
    .isBoolean()
    .withMessage('自動作成フラグはブール値である必要があります'),
  body('options.updateExisting')
    .optional()
    .isBoolean()
    .withMessage('既存更新フラグはブール値である必要があります'),
  body('options.skipErrors')
    .optional()
    .isBoolean()
    .withMessage('エラースキップフラグはブール値である必要があります'),
  body('options.dryRun')
    .optional()
    .isBoolean()
    .withMessage('ドライランフラグはブール値である必要があります'),
];

// インポート履歴取得のバリデーション
export const validateGetImportHistory: ValidationChain[] = [
  query('method')
    .optional()
    .isIn(Object.values(ImportMethod))
    .withMessage('無効なインポート方法です'),
  query('status')
    .optional()
    .isIn(Object.values(ImportStatus))
    .withMessage('無効なステータスです'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('開始日はISO8601形式である必要があります'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('終了日はISO8601形式である必要があります'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数である必要があります'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('取得件数は1〜100の間である必要があります'),
];

// カレンダー連携のバリデーション
export const validateCalendarConnect: ValidationChain[] = [
  body('provider')
    .notEmpty()
    .withMessage('プロバイダーは必須です')
    .isIn(['google', 'icloud', 'outlook'])
    .withMessage('プロバイダーは google, icloud, outlook のいずれかである必要があります'),
  body('authCode')
    .notEmpty()
    .withMessage('認証コードは必須です')
    .isString()
    .withMessage('認証コードは文字列である必要があります'),
  body('syncFrequency')
    .notEmpty()
    .withMessage('同期頻度は必須です')
    .isInt({ min: 5, max: 1440 }) // 5分〜24時間
    .withMessage('同期頻度は5〜1440分の間である必要があります'),
];

// ファイルIDのバリデーション
export const validateFileId: ValidationChain[] = [
  param('fileId')
    .notEmpty()
    .withMessage('ファイルIDは必須です')
    .isString()
    .withMessage('ファイルIDは文字列である必要があります'),
];

// マッピング保存のバリデーション
export const validateSaveMapping: ValidationChain[] = [
  body('mappingName')
    .notEmpty()
    .withMessage('マッピング名は必須です')
    .isString()
    .withMessage('マッピング名は文字列である必要があります')
    .isLength({ min: 1, max: 100 })
    .withMessage('マッピング名は1〜100文字である必要があります'),
  body('mappings')
    .isArray()
    .withMessage('マッピングは配列である必要があります')
    .notEmpty()
    .withMessage('マッピングは必須です'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('デフォルトフラグはブール値である必要があります'),
];