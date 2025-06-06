import { body, param, query } from 'express-validator';
import { TicketStatus } from '../../../types';

// チケット作成のバリデーション
export const createTicketValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('タイトルは必須です')
    .isLength({ max: 200 }).withMessage('タイトルは200文字以内で入力してください'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('説明は必須です')
    .isLength({ max: 5000 }).withMessage('説明は5000文字以内で入力してください'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('優先度が不正です'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('カテゴリーは50文字以内で入力してください')
];

// チケット一覧取得のバリデーション
export const getTicketsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('ページ番号は1以上の整数を指定してください'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('取得件数は1〜100の範囲で指定してください'),
  
  query('status')
    .optional()
    .isIn(Object.values(TicketStatus)).withMessage('ステータスが不正です'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('優先度が不正です'),
  
  query('category')
    .optional()
    .trim(),
  
  query('searchTerm')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('検索文字列は100文字以内で入力してください'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'status', 'priority']).withMessage('ソート項目が不正です'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('ソート順序が不正です')
];

// チケットIDのバリデーション
export const ticketIdValidator = [
  param('ticketId')
    .notEmpty().withMessage('チケットIDは必須です')
    .isMongoId().withMessage('チケットIDの形式が不正です')
];

// チケット返信のバリデーション
export const replyToTicketValidator = [
  ...ticketIdValidator,
  
  body('message')
    .trim()
    .notEmpty().withMessage('返信内容は必須です')
    .isLength({ max: 5000 }).withMessage('返信内容は5000文字以内で入力してください'),
  
  body('attachments')
    .optional()
    .isArray().withMessage('添付ファイルは配列形式で指定してください'),
  
  body('attachments.*')
    .optional()
    .isURL().withMessage('添付ファイルのURLが不正です')
];

// チケットステータス更新のバリデーション
export const updateTicketStatusValidator = [
  ...ticketIdValidator,
  
  body('status')
    .notEmpty().withMessage('ステータスは必須です')
    .isIn(Object.values(TicketStatus)).withMessage('ステータスが不正です')
];

// チケット更新のバリデーション
export const updateTicketValidator = [
  ...ticketIdValidator,
  
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('タイトルは空にできません')
    .isLength({ max: 200 }).withMessage('タイトルは200文字以内で入力してください'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('説明は空にできません')
    .isLength({ max: 5000 }).withMessage('説明は5000文字以内で入力してください'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('優先度が不正です'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('カテゴリーは50文字以内で入力してください'),
  
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('担当者IDの形式が不正です')
];

// チケット詳細取得のバリデーション
export const getTicketDetailValidator = [
  ...ticketIdValidator
];

// SuperAdmin用：組織IDでのフィルタリング
export const superAdminTicketsValidator = [
  ...getTicketsValidator,
  
  query('organizationId')
    .optional()
    .isMongoId().withMessage('組織IDの形式が不正です')
];