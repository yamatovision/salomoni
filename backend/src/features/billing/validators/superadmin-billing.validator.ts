import { query, param, body, ValidationChain } from 'express-validator';

export const validateBillingSummaryQuery: ValidationChain[] = [
  query('period')
    .optional()
    .isIn(['current_month', 'last_month', 'last_3_months', 'last_6_months', 'last_year'])
    .withMessage('無効な集計期間です'),
  query('organizationId')
    .optional()
    .isMongoId()
    .withMessage('無効な組織IDです')
];

export const validateInvoiceListQuery: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数である必要があります'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('1ページあたりの件数は1〜100の間である必要があります'),
  query('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'canceled'])
    .withMessage('無効な請求書ステータスです'),
  query('type')
    .optional()
    .isIn(['subscription', 'one_time', 'token_purchase'])
    .withMessage('無効な請求書タイプです'),
  query('organizationId')
    .optional()
    .isMongoId()
    .withMessage('無効な組織IDです'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('開始日はISO8601形式である必要があります'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('終了日はISO8601形式である必要があります')
    .custom((value, { req }) => {
      if (req.query?.startDate && value) {
        return new Date(value) >= new Date(req.query.startDate);
      }
      return true;
    })
    .withMessage('終了日は開始日以降である必要があります'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'dueDate', 'status'])
    .withMessage('無効なソート項目です'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('ソート順はascまたはdescである必要があります')
];

export const validateInvoiceIdParam: ValidationChain[] = [
  param('invoiceId')
    .notEmpty()
    .withMessage('請求書IDは必須です')
    .isMongoId()
    .withMessage('無効な請求書IDです')
];

export const validateInvoiceUpdate: ValidationChain[] = [
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'canceled'])
    .withMessage('無効な請求書ステータスです'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('管理者メモは500文字以内である必要があります'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('支払期限はISO8601形式である必要があります'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('メタデータはオブジェクトである必要があります')
];

export const validatePaymentHistoryQuery: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数である必要があります'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('1ページあたりの件数は1〜100の間である必要があります'),
  query('organizationId')
    .optional()
    .isMongoId()
    .withMessage('無効な組織IDです'),
  query('status')
    .optional()
    .isIn(['succeeded', 'failed', 'pending', 'refunded'])
    .withMessage('無効な支払いステータスです'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('開始日はISO8601形式である必要があります'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('終了日はISO8601形式である必要があります')
    .custom((value, { req }) => {
      if (req.query?.startDate && value) {
        return new Date(value) >= new Date(req.query.startDate);
      }
      return true;
    })
    .withMessage('終了日は開始日以降である必要があります'),
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最小金額は0以上である必要があります'),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最大金額は0以上である必要があります')
    .custom((value, { req }) => {
      if (req.query?.minAmount && value) {
        return parseFloat(value) >= parseFloat(req.query.minAmount);
      }
      return true;
    })
    .withMessage('最大金額は最小金額以上である必要があります')
];

export const validateRefundRequest: ValidationChain[] = [
  body('invoiceId')
    .notEmpty()
    .withMessage('請求書IDは必須です')
    .isMongoId()
    .withMessage('無効な請求書IDです'),
  body('amount')
    .notEmpty()
    .withMessage('返金額は必須です')
    .isFloat({ min: 0.01 })
    .withMessage('返金額は0より大きい必要があります'),
  body('reason')
    .notEmpty()
    .withMessage('返金理由は必須です')
    .isLength({ max: 500 })
    .withMessage('返金理由は500文字以内である必要があります'),
  body('notifyCustomer')
    .optional()
    .isBoolean()
    .withMessage('顧客への通知有無はブール値である必要があります')
];

export const validateMonthlyReportQuery: ValidationChain[] = [
  query('year')
    .notEmpty()
    .withMessage('年は必須です')
    .isInt({ min: 2020, max: new Date().getFullYear() })
    .withMessage(`年は2020〜${new Date().getFullYear()}の間である必要があります`),
  query('month')
    .notEmpty()
    .withMessage('月は必須です')
    .isInt({ min: 1, max: 12 })
    .withMessage('月は1〜12の間である必要があります'),
  query('includeDetails')
    .optional()
    .isBoolean()
    .withMessage('詳細データ含有フラグはブール値である必要があります')
];

export const validateReportExport: ValidationChain[] = [
  body('format')
    .notEmpty()
    .withMessage('エクスポート形式は必須です')
    .isIn(['csv', 'excel', 'pdf'])
    .withMessage('無効なエクスポート形式です'),
  body('type')
    .notEmpty()
    .withMessage('レポートタイプは必須です')
    .isIn(['invoices', 'payments', 'summary', 'full'])
    .withMessage('無効なレポートタイプです'),
  body('startDate')
    .notEmpty()
    .withMessage('開始日は必須です')
    .isISO8601()
    .withMessage('開始日はISO8601形式である必要があります'),
  body('endDate')
    .notEmpty()
    .withMessage('終了日は必須です')
    .isISO8601()
    .withMessage('終了日はISO8601形式である必要があります')
    .custom((value, { req }) => {
      if (req.body?.startDate && value) {
        return new Date(value) >= new Date(req.body.startDate);
      }
      return true;
    })
    .withMessage('終了日は開始日以降である必要があります'),
  body('organizationId')
    .optional()
    .isMongoId()
    .withMessage('無効な組織IDです'),
  body('includeRefunds')
    .optional()
    .isBoolean()
    .withMessage('返金データ含有フラグはブール値である必要があります')
];