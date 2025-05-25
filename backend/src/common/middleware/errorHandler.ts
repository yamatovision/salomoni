import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import type { ApiError } from '../../types';

export class AppError extends Error {
  public statusCode: number;
  public override message: string;
  public code?: string;
  public details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    if (code !== undefined) {
      this.code = code;
    }
    if (details !== undefined) {
      this.details = details;
    }
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ログ出力
  logger.error('Error caught by error handler:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error instanceof AppError && { code: error.code }),
  });

  // AppErrorの場合
  if (error instanceof AppError) {
    const response: ApiError = {
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // MongoDBのバリデーションエラー
  if (error.name === 'ValidationError') {
    const response: ApiError = {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: { message: error.message },
    };
    res.status(400).json(response);
    return;
  }

  // MongoDBの重複エラー
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const response: ApiError = {
      success: false,
      error: 'Duplicate entry found',
      code: 'DUPLICATE_ENTRY',
      details: { message: error.message },
    };
    res.status(409).json(response);
    return;
  }

  // MongoDBのCastError（ObjectId変換エラー）
  if (error.name === 'CastError') {
    const castError = error as any;
    if (castError.path === '_id' && castError.kind === 'ObjectId') {
      // エラーメッセージからどのモデルでエラーが発生したか判定
      const isUser = castError.message?.includes('User');
      const response: ApiError = {
        success: false,
        error: isUser ? 'ユーザーが見つかりません' : 'リソースが見つかりません',
        code: 'RESOURCE_NOT_FOUND',
      };
      res.status(404).json(response);
      return;
    }
    // その他のCastError
    const response: ApiError = {
      success: false,
      error: '無効なパラメータです',
      code: 'INVALID_PARAMETER',
      details: { field: castError.path, value: castError.value },
    };
    res.status(400).json(response);
    return;
  }

  // JWT関連のエラー
  if (error.name === 'JsonWebTokenError') {
    const response: ApiError = {
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    };
    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response: ApiError = {
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    };
    res.status(401).json(response);
    return;
  }

  // その他のエラー
  const response: ApiError = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { 
      details: { stack: error.stack } 
    }),
  };
  
  res.status(500).json(response);
};