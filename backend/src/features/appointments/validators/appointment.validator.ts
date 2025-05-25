import { body, param, query } from 'express-validator';
import { AppointmentStatus } from '../../../types';

// 予約作成バリデーション
export const createAppointmentValidator = [
  body('clientId')
    .notEmpty()
    .withMessage('クライアントIDは必須です')
    .isString()
    .withMessage('クライアントIDは文字列である必要があります'),
  
  body('stylistId')
    .optional()
    .isString()
    .withMessage('スタイリストIDは文字列である必要があります'),
  
  body('scheduledAt')
    .notEmpty()
    .withMessage('予約日時は必須です')
    .isISO8601()
    .withMessage('予約日時は有効な日時形式である必要があります')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate < now) {
        throw new Error('予約日時は現在時刻より後である必要があります');
      }
      return true;
    }),
  
  body('duration')
    .notEmpty()
    .withMessage('所要時間は必須です')
    .isInt({ min: 15, max: 480 })
    .withMessage('所要時間は15分以上480分以下である必要があります'),
  
  body('services')
    .notEmpty()
    .withMessage('サービスは必須です')
    .isArray({ min: 1 })
    .withMessage('少なくとも1つのサービスを選択してください'),
  
  body('services.*')
    .isString()
    .withMessage('サービスは文字列である必要があります'),
  
  body('note')
    .optional()
    .isString()
    .withMessage('備考は文字列である必要があります')
    .isLength({ max: 1000 })
    .withMessage('備考は1000文字以下で入力してください'),
];

// 予約一覧取得バリデーション
export const getAppointmentsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数である必要があります'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('取得件数は1以上100以下の整数である必要があります'),
  
  query('status')
    .optional()
    .isIn(Object.values(AppointmentStatus))
    .withMessage('無効なステータスです'),
  
  query('stylistId')
    .optional()
    .isString()
    .withMessage('スタイリストIDは文字列である必要があります'),
  
  query('clientId')
    .optional()
    .isString()
    .withMessage('クライアントIDは文字列である必要があります'),
  
  query('from')
    .optional()
    .isISO8601()
    .withMessage('開始日時は有効な日時形式である必要があります'),
  
  query('to')
    .optional()
    .isISO8601()
    .withMessage('終了日時は有効な日時形式である必要があります')
    .custom((value, { req }) => {
      if (req.query?.from && value) {
        const from = new Date(req.query.from);
        const to = new Date(value);
        if (to <= from) {
          throw new Error('終了日時は開始日時より後である必要があります');
        }
      }
      return true;
    }),
];

// ID パラメータバリデーション
export const appointmentIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('予約IDは必須です')
    .isMongoId()
    .withMessage('無効な予約IDです'),
];

// スタイリスト割当バリデーション
export const assignStylistValidator = [
  ...appointmentIdValidator,
  body('stylistId')
    .notEmpty()
    .withMessage('スタイリストIDは必須です')
    .isString()
    .withMessage('スタイリストIDは文字列である必要があります'),
];

// 予約時間変更バリデーション
export const moveAppointmentValidator = [
  ...appointmentIdValidator,
  body('scheduledAt')
    .notEmpty()
    .withMessage('予約日時は必須です')
    .isISO8601()
    .withMessage('予約日時は有効な日時形式である必要があります')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate < now) {
        throw new Error('予約日時は現在時刻より後である必要があります');
      }
      return true;
    }),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('所要時間は15分以上480分以下である必要があります'),
];