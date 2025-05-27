import Joi from 'joi';
import { PlanType, BillingCycle } from '../models/plan.model';

// プラン作成スキーマ
export const createPlanSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'プラン名は必須です',
    'any.required': 'プラン名は必須です'
  }),
  type: Joi.string().valid(...Object.values(PlanType)).required().messages({
    'string.empty': 'プランタイプは必須です',
    'any.required': 'プランタイプは必須です',
    'any.only': 'プランタイプが無効です'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': '価格は数値である必要があります',
    'number.min': '価格は0以上である必要があります',
    'any.required': '価格は必須です'
  }),
  billingCycle: Joi.string().valid(...Object.values(BillingCycle)).required().messages({
    'string.empty': '請求サイクルは必須です',
    'any.required': '請求サイクルは必須です',
    'any.only': '請求サイクルが無効です'
  }),
  features: Joi.array().items(Joi.string()).default([]).messages({
    'array.base': '機能リストは配列である必要があります'
  }),
  limits: Joi.when('type', {
    is: PlanType.SUBSCRIPTION,
    then: Joi.object({
      stylists: Joi.number().min(0).required(),
      clients: Joi.number().min(0).required(),
      tokensPerMonth: Joi.number().min(0).required()
    }).required().messages({
      'object.base': 'サブスクリプションプランには制限値が必要です',
      'any.required': 'サブスクリプションプランには制限値が必要です'
    }),
    otherwise: Joi.object({
      stylists: Joi.number().min(0).optional(),
      clients: Joi.number().min(0).optional(),
      tokensPerMonth: Joi.number().min(0).optional()
    }).optional()
  }),
  tokenAmount: Joi.when('type', {
    is: PlanType.TOKEN_PACK,
    then: Joi.number().min(1).required().messages({
      'number.base': 'トークン数は数値である必要があります',
      'number.min': 'トークン数は1以上である必要があります',
      'any.required': 'トークンパックにはトークン数が必要です'
    }),
    otherwise: Joi.number().optional()
  }),
  displayOrder: Joi.number().min(0).default(0).messages({
    'number.base': '表示順序は数値である必要があります',
    'number.min': '表示順序は0以上である必要があります'
  }),
  metadata: Joi.object().optional()
});

// プラン更新スキーマ
export const updatePlanSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    'string.empty': 'プラン名は空にできません'
  }),
  price: Joi.number().min(0).optional().messages({
    'number.base': '価格は数値である必要があります',
    'number.min': '価格は0以上である必要があります'
  }),
  features: Joi.array().items(Joi.string()).optional().messages({
    'array.base': '機能リストは配列である必要があります'
  }),
  limits: Joi.object({
    stylists: Joi.number().min(0).optional(),
    clients: Joi.number().min(0).optional(),
    tokensPerMonth: Joi.number().min(0).optional()
  }).optional(),
  tokenAmount: Joi.number().min(1).optional().messages({
    'number.base': 'トークン数は数値である必要があります',
    'number.min': 'トークン数は1以上である必要があります'
  }),
  isActive: Joi.boolean().optional(),
  displayOrder: Joi.number().min(0).optional().messages({
    'number.base': '表示順序は数値である必要があります',
    'number.min': '表示順序は0以上である必要があります'
  }),
  metadata: Joi.object().optional()
}).min(1).messages({
  'object.min': '少なくとも1つのフィールドを更新する必要があります'
});

// プラン一覧クエリスキーマ
export const planQuerySchema = Joi.object({
  type: Joi.string().valid(...Object.values(PlanType)).optional().messages({
    'any.only': 'プランタイプが無効です'
  }),
  isActive: Joi.boolean().optional(),
  page: Joi.number().min(1).default(1).messages({
    'number.base': 'ページ番号は数値である必要があります',
    'number.min': 'ページ番号は1以上である必要があります'
  }),
  limit: Joi.number().min(1).max(100).default(20).messages({
    'number.base': '表示件数は数値である必要があります',
    'number.min': '表示件数は1以上である必要があります',
    'number.max': '表示件数は100以下である必要があります'
  })
});

// バリデーションエラーのフォーマット
export const formatValidationError = (error: Joi.ValidationError): string => {
  const details = error.details.map(detail => detail.message).join(', ');
  return details;
};