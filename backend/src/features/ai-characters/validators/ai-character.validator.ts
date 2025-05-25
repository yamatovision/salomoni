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