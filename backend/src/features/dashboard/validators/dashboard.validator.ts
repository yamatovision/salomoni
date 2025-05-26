import { query } from 'express-validator';

/**
 * ダッシュボード関連のバリデーションルール
 */
export const dashboardValidators = {
  /**
   * チャート期間のバリデーション
   */
  chartPeriod: [
    query('period')
      .optional()
      .isIn(['7days', '30days', '90days', '1year'])
      .withMessage('期間は7days, 30days, 90days, 1yearのいずれかを指定してください')
  ],

  /**
   * 日付範囲のバリデーション
   */
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('開始日は有効な日付形式で指定してください'),
    query('endDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('終了日は有効な日付形式で指定してください')
      .custom((value, { req }) => {
        if (req.query?.startDate && value) {
          const startDate = new Date(req.query.startDate);
          const endDate = new Date(value);
          if (endDate < startDate) {
            throw new Error('終了日は開始日より後の日付を指定してください');
          }
        }
        return true;
      })
  ],

  /**
   * ページネーションのバリデーション
   */
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt()
      .withMessage('ページ番号は1以上の整数を指定してください'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('表示件数は1〜100の整数を指定してください')
  ],

  /**
   * チャートタイプのバリデーション
   */
  chartType: [
    query('type')
      .optional()
      .isIn(['line', 'bar', 'pie', 'doughnut'])
      .withMessage('チャートタイプはline, bar, pie, doughnutのいずれかを指定してください')
  ],

  /**
   * 統計タイプのバリデーション
   */
  statsType: [
    query('type')
      .optional()
      .isIn(['summary', 'detailed', 'realtime'])
      .withMessage('統計タイプはsummary, detailed, realtimeのいずれかを指定してください')
  ]
};