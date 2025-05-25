import Joi from 'joi';
import { OrganizationPlan, TokenPackage } from '../../../types/index';

export const createPaymentMethodSchema = Joi.object({
  organizationId: Joi.string().required().messages({
    'any.required': '組織IDは必須です',
    'string.empty': '組織IDを入力してください'
  }),
  cardDetails: Joi.object({
    cardholder: Joi.string().min(2).max(100).required().messages({
      'any.required': 'カード名義人は必須です',
      'string.min': 'カード名義人は2文字以上で入力してください',
      'string.max': 'カード名義人は100文字以内で入力してください'
    }),
    cardNumber: Joi.string().pattern(/^\d{13,19}$/).required().messages({
      'any.required': 'カード番号は必須です',
      'string.pattern.base': 'カード番号は13-19桁の数字で入力してください'
    }),
    expMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required().messages({
      'any.required': '有効期限（月）は必須です',
      'string.pattern.base': '有効期限（月）は01-12の形式で入力してください'
    }),
    expYear: Joi.string().pattern(/^\d{4}$/).required().messages({
      'any.required': '有効期限（年）は必須です',
      'string.pattern.base': '有効期限（年）は4桁の西暦で入力してください'
    }),
    cvv: Joi.string().pattern(/^\d{3,4}$/).required().messages({
      'any.required': 'セキュリティコードは必須です',
      'string.pattern.base': 'セキュリティコードは3-4桁の数字で入力してください'
    })
  }).required(),
  email: Joi.string().email().required().messages({
    'any.required': 'メールアドレスは必須です',
    'string.email': '有効なメールアドレスを入力してください'
  }),
  isDefault: Joi.boolean().default(false)
});

export const createSubscriptionSchema = Joi.object({
  organizationId: Joi.string().required().messages({
    'any.required': '組織IDは必須です'
  }),
  plan: Joi.string().valid('standard', 'professional', 'enterprise').required().messages({
    'any.required': 'プランは必須です',
    'any.only': 'プランはstandard、professional、enterpriseのいずれかを選択してください'
  }),
  paymentMethodId: Joi.string().required().messages({
    'any.required': '支払い方法IDは必須です'
  }),
  trialDays: Joi.number().integer().min(0).max(30).optional().messages({
    'number.integer': 'トライアル日数は整数で入力してください',
    'number.min': 'トライアル日数は0以上で入力してください',
    'number.max': 'トライアル日数は30日以下で入力してください'
  }),
  metadata: Joi.object().optional()
});

export const updateSubscriptionSchema = Joi.object({
  plan: Joi.string().valid('standard', 'professional', 'enterprise').optional().messages({
    'any.only': 'プランはstandard、professional、enterpriseのいずれかを選択してください'
  }),
  status: Joi.string().valid('active', 'past_due', 'canceled', 'incomplete', 'trialing').optional().messages({
    'any.only': 'ステータスは有効な値を選択してください'
  }),
  metadata: Joi.object().optional()
});

export const tokenChargeSchema = Joi.object({
  organizationId: Joi.string().required().messages({
    'any.required': '組織IDは必須です'
  }),
  tokenPackage: Joi.string().valid('standard', 'premium').required().messages({
    'any.required': 'トークンパッケージは必須です',
    'any.only': 'トークンパッケージはstandardまたはpremiumを選択してください'
  }),
  paymentMethodId: Joi.string().optional().messages({
    'string.empty': '支払い方法IDを正しく入力してください'
  })
});

export const webhookSchema = Joi.object({
  type: Joi.string().required().messages({
    'any.required': 'Webhookタイプは必須です'
  }),
  data: Joi.object().required().messages({
    'any.required': 'Webhookデータは必須です'
  }),
  created: Joi.date().optional(),
  livemode: Joi.boolean().optional()
});

export const billingQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.format': '開始日はISO8601形式で入力してください'
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.format': '終了日はISO8601形式で入力してください',
    'date.min': '終了日は開始日以降の日付を指定してください'
  }),
  status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'canceled').optional().messages({
    'any.only': 'ステータスは有効な値を選択してください'
  }),
  type: Joi.string().valid('subscription', 'one-time', 'token').optional().messages({
    'any.only': 'タイプは有効な値を選択してください'
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.integer': 'リミットは整数で入力してください',
    'number.min': 'リミットは1以上で入力してください',
    'number.max': 'リミットは100以下で入力してください'
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.integer': 'オフセットは整数で入力してください',
    'number.min': 'オフセットは0以上で入力してください'
  })
});

export const paymentMethodUpdateSchema = Joi.object({
  isDefault: Joi.boolean().required().messages({
    'any.required': 'デフォルト設定は必須です',
    'boolean.base': 'デフォルト設定はtrue/falseで指定してください'
  })
});

// カード番号の基本バリデーション
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  // Luhnアルゴリズムによる検証
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    const char = cleanNumber.charAt(i);
    let digit = parseInt(char);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// 有効期限の検証
export const validateExpiryDate = (month: string, year: string): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const expYear = parseInt(year);
  const expMonth = parseInt(month);
  
  if (expYear < currentYear) {
    return false;
  }
  
  if (expYear === currentYear && expMonth < currentMonth) {
    return false;
  }
  
  return true;
};

// カードブランドの検出
export const detectCardBrand = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(cleanNumber)) return 'visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  if (/^35/.test(cleanNumber)) return 'jcb';
  if (/^30[0-5]/.test(cleanNumber)) return 'diners';
  
  return 'unknown';
};

// バリデーションエラーメッセージの整形
export const formatValidationError = (error: Joi.ValidationError): string => {
  return error.details.map(detail => detail.message).join(', ');
};

// 組織の課金権限チェック
export const validateBillingPermission = (userRole: string): boolean => {
  return ['owner', 'admin'].includes(userRole);
};

// プラン変更の妥当性チェック
export const validatePlanChange = (currentPlan: OrganizationPlan, newPlan: OrganizationPlan): {
  isValid: boolean;
  isUpgrade: boolean;
  isDowngrade: boolean;
  requiresImmediatePayment: boolean;
} => {
  const planHierarchy = {
    standard: 1,
    professional: 2,
    enterprise: 3
  };
  
  const currentLevel = planHierarchy[currentPlan];
  const newLevel = planHierarchy[newPlan];
  
  const isUpgrade = newLevel > currentLevel;
  const isDowngrade = newLevel < currentLevel;
  
  return {
    isValid: currentPlan !== newPlan,
    isUpgrade,
    isDowngrade,
    requiresImmediatePayment: isUpgrade
  };
};

// トークンパッケージの妥当性チェック
export const validateTokenPackage = (tokenPackage: TokenPackage): boolean => {
  return ['standard', 'premium'].includes(tokenPackage);
};