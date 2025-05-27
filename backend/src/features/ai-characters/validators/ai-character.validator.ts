import { body, param, query } from 'express-validator';
import { AICharacterStyle } from '../../../types';

// AIキャラクター作成
export const createAICharacterValidator = [
  body('name')
    .notEmpty().withMessage('AIキャラクター名は必須です')
    .isString().withMessage('AIキャラクター名は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('AIキャラクター名は1〜50文字で入力してください'),
  
  body('userId')
    .optional()
    .isMongoId().withMessage('有効なユーザーIDを指定してください'),
  
  body('clientId')
    .optional()
    .isMongoId().withMessage('有効なクライアントIDを指定してください'),
  
  body('styleFlags')
    .optional()
    .isArray().withMessage('スタイルフラグは配列で指定してください')
    .custom((value: string[]) => {
      if (value.length > 0) {
        return value.every(style => Object.values(AICharacterStyle).includes(style as AICharacterStyle));
      }
      return true;
    }).withMessage('無効なスタイルフラグが含まれています'),
  
  body('personalityScore.softness')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('やさしさ度は0〜100の整数で入力してください'),
  
  body('personalityScore.energy')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('エネルギー度は0〜100の整数で入力してください'),
  
  body('personalityScore.formality')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('フォーマル度は0〜100の整数で入力してください'),
];

// AIキャラクター更新
export const updateAICharacterValidator = [
  param('id')
    .isMongoId().withMessage('有効なAIキャラクターIDを指定してください'),
  
  body('name')
    .optional()
    .isString().withMessage('AIキャラクター名は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('AIキャラクター名は1〜50文字で入力してください'),
  
  body('styleFlags')
    .optional()
    .isArray().withMessage('スタイルフラグは配列で指定してください')
    .custom((value: string[]) => {
      if (value.length > 0) {
        return value.every(style => Object.values(AICharacterStyle).includes(style as AICharacterStyle));
      }
      return true;
    }).withMessage('無効なスタイルフラグが含まれています'),
  
  body('personalityScore.softness')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('やさしさ度は0〜100の整数で入力してください'),
  
  body('personalityScore.energy')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('エネルギー度は0〜100の整数で入力してください'),
  
  body('personalityScore.formality')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('フォーマル度は0〜100の整数で入力してください'),
];

// AIメモリ作成・更新
export const createUpdateAIMemoryValidator = [
  param('characterId')
    .isMongoId().withMessage('有効なAIキャラクターIDを指定してください'),
  
  body('memoryType')
    .notEmpty().withMessage('メモリタイプは必須です')
    .isIn(['explicit', 'auto']).withMessage('メモリタイプはexplicitまたはautoで指定してください'),
  
  body('content')
    .notEmpty().withMessage('メモリ内容は必須です')
    .isString().withMessage('メモリ内容は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 1000 }).withMessage('メモリ内容は1〜1000文字で入力してください'),
  
  body('category')
    .notEmpty().withMessage('カテゴリは必須です')
    .isIn(['preference', 'experience', 'relationship', 'goal', 'characteristic', 'other'])
    .withMessage('有効なカテゴリを指定してください'),
  
  body('extractedFrom')
    .optional()
    .isString().withMessage('抽出元は文字列で入力してください')
    .trim(),
  
  body('confidence')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('信頼度は0〜100の整数で入力してください'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('アクティブ状態はtrue/falseで指定してください'),
];

// AIメモリ取得
export const getAIMemoryValidator = [
  param('characterId')
    .isMongoId().withMessage('有効なAIキャラクターIDを指定してください'),
  
  query('category')
    .optional()
    .isIn(['preference', 'experience', 'relationship', 'goal', 'characteristic', 'other'])
    .withMessage('有効なカテゴリを指定してください'),
  
  query('isActive')
    .optional()
    .isBoolean().withMessage('アクティブ状態はtrue/falseで指定してください'),
];

// ID パラメータ検証
export const idParamValidator = [
  param('id')
    .isMongoId().withMessage('有効なIDを指定してください'),
];

// AIキャラクターセットアップ状態確認（パラメータなし）
export const setupStatusValidator = [];

// 自然言語入力処理
export const processNaturalInputValidator = [
  body('input')
    .notEmpty().withMessage('入力内容は必須です')
    .isString().withMessage('入力内容は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage('入力内容は1〜500文字で入力してください'),
  
  body('field')
    .notEmpty().withMessage('フィールド種別は必須です')
    .isIn(['personality', 'style']).withMessage('フィールド種別はpersonalityまたはstyleで指定してください'),
];

// AIキャラクターセットアップ
export const setupAICharacterValidator = [
  body('name')
    .notEmpty().withMessage('AIキャラクター名は必須です')
    .isString().withMessage('AIキャラクター名は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('AIキャラクター名は1〜50文字で入力してください'),
  
  body('birthDate')
    .notEmpty().withMessage('生年月日は必須です')
    .isISO8601().withMessage('生年月日はISO 8601形式（YYYY-MM-DD）で入力してください'),
  
  body('birthPlace')
    .notEmpty().withMessage('出生地は必須です')
    .isString().withMessage('出生地は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('出生地は1〜100文字で入力してください'),
  
  body('birthTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('出生時間はHH:mm形式で入力してください'),
  
  body('personalityInput')
    .notEmpty().withMessage('性格の説明は必須です')
    .isString().withMessage('性格の説明は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage('性格の説明は1〜500文字で入力してください'),
  
  body('styleInput')
    .notEmpty().withMessage('スタイルの説明は必須です')
    .isString().withMessage('スタイルの説明は文字列で入力してください')
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage('スタイルの説明は1〜500文字で入力してください'),
  
  body('processedPersonality')
    .notEmpty().withMessage('処理済み性格データは必須です')
    .isObject().withMessage('処理済み性格データはオブジェクトで指定してください'),
  
  body('processedPersonality.softness')
    .notEmpty().withMessage('やさしさ度は必須です')
    .isInt({ min: 0, max: 100 }).withMessage('やさしさ度は0〜100の整数で入力してください'),
  
  body('processedPersonality.energy')
    .notEmpty().withMessage('エネルギー度は必須です')
    .isInt({ min: 0, max: 100 }).withMessage('エネルギー度は0〜100の整数で入力してください'),
  
  body('processedPersonality.formality')
    .notEmpty().withMessage('フォーマル度は必須です')
    .isInt({ min: 0, max: 100 }).withMessage('フォーマル度は0〜100の整数で入力してください'),
  
  body('processedStyle')
    .notEmpty().withMessage('処理済みスタイルデータは必須です')
    .isArray().withMessage('処理済みスタイルデータは配列で指定してください')
    .custom((value: string[]) => {
      if (value.length === 0) {
        throw new Error('スタイルフラグを少なくとも1つ指定してください');
      }
      return value.every(style => Object.values(AICharacterStyle).includes(style as AICharacterStyle));
    }).withMessage('無効なスタイルフラグが含まれています'),
];