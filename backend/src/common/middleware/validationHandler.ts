import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    // 最初のエラーメッセージを主要メッセージとして使用
    const primaryMessage = errorMessages[0]?.message || 'Validation failed';

    const validationError = new AppError(primaryMessage, 400, 'VALIDATION_ERROR');
    // バリデーションエラーの詳細を追加
    (validationError as any).validationErrors = errorMessages;

    next(validationError);
    return;
  }
  
  next();
};

// バリデーションスキーマと、任意のフィールドロケーションを受け取る関数
export const validationHandler = (
  validationRules: ValidationChain[]
) => {
  return [
    ...validationRules,
    handleValidationErrors
  ];
};

// エイリアスをエクスポート（後方互換性のため）
export const validate = validationHandler;