import { body, query } from 'express-validator';

// クライアント作成リクエストのバリデーションスキーマ
export const createClientSchema = [
  body('name')
    .notEmpty().withMessage('クライアント名は必須です')
    .isLength({ min: 1, max: 100 }).withMessage('クライアント名は1〜100文字で入力してください'),
  body('birthDate')
    .optional()
    .isISO8601().withMessage('生年月日は有効な日付形式（YYYY-MM-DD）で入力してください'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('性別は male, female, other のいずれかを選択してください'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('有効なメールアドレスを入力してください'),
  body('phoneNumber')
    .optional({ checkFalsy: true })
    .matches(/^[\d\-\+\(\)\s]+$/).withMessage('電話番号は数字、ハイフン、括弧、スペースのみ使用できます'),
  body('memo')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 }).withMessage('メモは1000文字以内で入力してください'),
];

// クライアント更新リクエストのバリデーションスキーマ
export const updateClientSchema = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('クライアント名は1〜100文字で入力してください'),
  body('birthDate')
    .optional()
    .isISO8601().withMessage('生年月日は有効な日付形式（YYYY-MM-DD）で入力してください'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('性別は male, female, other のいずれかを選択してください'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('有効なメールアドレスを入力してください'),
  body('phoneNumber')
    .optional({ checkFalsy: true })
    .matches(/^[\d\-\+\(\)\s]+$/).withMessage('電話番号は数字、ハイフン、括弧、スペースのみ使用できます'),
  body('memo')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 }).withMessage('メモは1000文字以内で入力してください'),
];

// クライアント検索クエリのバリデーションスキーマ
export const searchClientsSchema = [
  query('searchTerm').optional(),
  query('gender').optional().isIn(['male', 'female', 'other']),
  query('birthDateFrom').optional().isISO8601(),
  query('birthDateTo').optional().isISO8601(),
  query('hasAppointmentInMonth').optional().isBoolean(),
  query('isFavorite').optional().isBoolean(),
  query('missingBirthDate').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['name', 'createdAt', 'lastVisitDate', 'visitCount']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

// 本日の担当クライアント取得クエリのバリデーションスキーマ
export const dailyClientsSchema = [
  query('stylistId').optional(),
  query('date').optional().isISO8601(),
];