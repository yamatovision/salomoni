import { body, param, query, ValidationChain } from 'express-validator';

export const fortuneValidator = {
  // 日運データ取得のバリデーション
  getDailyFortune: [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('日付はISO8601形式で指定してください'),
    query('userId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('ユーザーIDが不正です'),
    query('clientId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('クライアントIDが不正です'),
    query()
      .custom((_value, { req }) => {
        const { userId, clientId } = req.query as any;
        if (!userId && !clientId) {
          throw new Error('ユーザーIDまたはクライアントIDが必要です');
        }
        return true;
      }),
  ] as ValidationChain[],

  // AIアドバイス生成のバリデーション
  getDailyAdvice: [
    param('userId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('ユーザーIDは必須です'),
    query('date')
      .optional()
      .isISO8601()
      .withMessage('日付はISO8601形式で指定してください'),
    query('regenerate')
      .optional()
      .isBoolean()
      .withMessage('再生成フラグはboolean型で指定してください'),
  ] as ValidationChain[],

  // 運勢カード取得のバリデーション
  getFortuneCards: [
    query('category')
      .optional()
      .isString()
      .trim()
      .withMessage('カテゴリーは文字列で指定してください'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('取得件数は1〜100の間で指定してください'),
  ] as ValidationChain[],

  // 本日の相性スタイリスト取得のバリデーション
  getCompatibilityToday: [
    query('userId')
      .exists({ checkFalsy: true })
      .withMessage('ユーザーIDは必須です')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('ユーザーIDは必須です'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('取得件数は1〜10の間で指定してください'),
  ] as ValidationChain[],

  // 週間運勢取得のバリデーション
  getWeeklyFortune: [
    query('userId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('ユーザーIDが不正です'),
    query('clientId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('クライアントIDが不正です'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('開始日はISO8601形式で指定してください'),
  ] as ValidationChain[],

  // 月間運勢取得のバリデーション
  getMonthlyFortune: [
    query('userId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('ユーザーIDが不正です'),
    query('clientId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('クライアントIDが不正です'),
    query('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('年は2000〜2100の間で指定してください'),
    query('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('月は1〜12の間で指定してください'),
  ] as ValidationChain[],

  // アドバイス再生成のバリデーション
  regenerateAdvice: [
    param('userId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('ユーザーIDは必須です'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('日付はISO8601形式で指定してください'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('再生成理由は500文字以内で入力してください'),
  ] as ValidationChain[],
};