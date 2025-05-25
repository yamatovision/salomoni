import { body, param, query } from 'express-validator';

// 会話作成
export const createConversationValidator = [
  body('userId')
    .optional()
    .isMongoId().withMessage('有効なユーザーIDを指定してください'),
  
  body('clientId')
    .optional()
    .isMongoId().withMessage('有効なクライアントIDを指定してください'),
  
  body('aiCharacterId')
    .notEmpty().withMessage('AIキャラクターIDは必須です')
    .isMongoId().withMessage('有効なAIキャラクターIDを指定してください'),
  
  body('context')
    .notEmpty().withMessage('コンテキストは必須です')
    .isIn(['personal', 'stylist_consultation', 'client_direct'])
    .withMessage('有効なコンテキストを指定してください'),
];

// 会話一覧取得
export const getConversationsValidator = [
  query('context')
    .optional()
    .isIn(['personal', 'stylist_consultation', 'client_direct'])
    .withMessage('有効なコンテキストを指定してください'),
  
  query('aiCharacterId')
    .optional()
    .isMongoId().withMessage('有効なAIキャラクターIDを指定してください'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('ページ番号は1以上の整数で指定してください'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('件数は1〜100の整数で指定してください'),
];

// メッセージ送信
export const sendMessageValidator = [
  param('conversationId')
    .isMongoId().withMessage('有効な会話IDを指定してください'),
  
  body('content')
    .notEmpty().withMessage('メッセージ内容は必須です')
    .isString().withMessage('メッセージ内容は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 4000 }).withMessage('メッセージは1〜4000文字で入力してください'),
  
  body('metadata')
    .optional()
    .isObject().withMessage('メタデータはオブジェクトで指定してください'),
];

// メッセージ取得
export const getMessagesValidator = [
  param('conversationId')
    .isMongoId().withMessage('有効な会話IDを指定してください'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('ページ番号は1以上の整数で指定してください'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('件数は1〜100の整数で指定してください'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('順序はascまたはdescで指定してください'),
];

// 会話ID パラメータ検証
export const conversationIdParamValidator = [
  param('conversationId')
    .isMongoId().withMessage('有効な会話IDを指定してください'),
];

// ID パラメータ検証
export const idParamValidator = [
  param('id')
    .isMongoId().withMessage('有効なIDを指定してください'),
];