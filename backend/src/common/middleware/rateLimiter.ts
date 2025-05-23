import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { AppError } from './errorHandler';

// レート制限の設定（認証設計書に基づき100回/分）
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 100, // 最大100リクエスト
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // `RateLimit-*` ヘッダーを返す
  legacyHeaders: false, // `X-RateLimit-*` ヘッダーを無効化
  keyGenerator: (req: Request) => {
    // IPアドレスとユーザーIDの組み合わせでレート制限
    const userId = (req as any).user?.id;
    return userId ? `${req.ip}-${userId}` : req.ip || 'unknown';
  },
  handler: (_req, _res, next) => {
    next(new AppError(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED'));
  },
});

// 認証エンドポイント用の厳しいレート制限
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100回の試行
  skipSuccessfulRequests: true, // 成功したリクエストはカウントしない
  message: 'Too many failed login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // メールアドレスまたはIPアドレスでレート制限
    const email = req.body?.email;
    return email || req.ip || 'unknown';
  },
  handler: (_req, _res, next) => {
    next(new AppError(429, 'Too many failed attempts', 'AUTH_RATE_LIMIT_EXCEEDED', {
      retryAfter: '15 minutes',
    }));
  },
});