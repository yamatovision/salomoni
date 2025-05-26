import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import type { UserRole } from '../../types';
import { logger } from '../utils/logger';

// JWTペイロードの型定義
export interface JWTPayload {
  id: string; // userIdと同じ値（互換性のため）
  userId: string;
  email: string;
  roles: UserRole[];
  currentRole: UserRole;
  organizationId: string;
  sessionId: string;
  platform: 'mobile' | 'web';
}

// 認証済みリクエストの型拡張
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// 認証済みリクエストの型定義
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// JWT検証ミドルウェア
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.accessToken;

    if (!token) {
      throw new AppError('No token provided', 401, 'AUTH001');
    }

    // トークンの検証
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret is not configured');
    }

    const payload = jwt.verify(token, secret) as JWTPayload;
    
    // ペイロードの検証
    if (!payload.userId || !payload.roles || !payload.currentRole) {
      throw new AppError('Invalid token payload', 401, 'AUTH002');
    }

    // リクエストにユーザー情報を追加
    req.user = payload;

    logger.debug('User authenticated', {
      userId: payload.userId,
      currentRole: payload.currentRole,
      platform: payload.platform,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401, 'AUTH003'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401, 'AUTH002'));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication error', 500, 'AUTH_ERROR'));
    }
  }
};

// ロールベースアクセス制御ミドルウェア
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Not authenticated', 401, 'AUTH001'));
      return;
    }

    // SuperAdminは全てのリソースにアクセス可能
    if (req.user.roles.includes('superadmin' as UserRole)) {
      next();
      return;
    }

    // 現在のロールが許可されたロールに含まれているかチェック
    const hasPermission = allowedRoles.includes(req.user.currentRole);
    
    // または、ユーザーが持つ全てのロールをチェック
    const hasAnyRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasPermission && !hasAnyRole) {
      logger.warn('Access denied', {
        userId: req.user.userId,
        currentRole: req.user.currentRole,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      
      next(new AppError('権限がありません', 403, 'AUTH004'));
      return;
    }

    next();
  };
};

// 組織境界チェックミドルウェア
export const checkOrganizationAccess = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new AppError('Not authenticated', 401, 'AUTH001'));
    return;
  }

  // SuperAdminは全組織にアクセス可能
  if (req.user.roles.includes('superadmin' as UserRole)) {
    next();
    return;
  }

  // リクエストされた組織IDを取得
  const requestedOrgId = req.params.organizationId || 
                        req.params.id || // 組織詳細取得用
                        req.body?.organizationId || 
                        req.query.organizationId;

  if (requestedOrgId && requestedOrgId !== req.user.organizationId) {
    logger.warn('Cross-organization access attempt', {
      userId: req.user.userId,
      userOrgId: req.user.organizationId,
      requestedOrgId,
    });
    
    next(new AppError('Access denied to this organization', 403, 'AUTH005'));
    return;
  }

  next();
};

// クライアントアクセスチェックミドルウェア
export const checkClientAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    next(new AppError('Not authenticated', 401, 'AUTH001'));
    return;
  }

  // SuperAdminは全クライアントにアクセス可能
  if (req.user.roles.includes('superadmin' as UserRole)) {
    next();
    return;
  }

  // クライアントIDから組織IDを確認する必要がある
  // これはサービス層で組織境界チェックを行うため、ここでは認証のみチェック
  next();
};

// オプショナル認証（認証があれば追加、なくても続行）
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.accessToken;

    if (!token) {
      next();
      return;
    }

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    const payload = jwt.verify(token, secret) as JWTPayload;
    req.user = payload;
    next();
  } catch {
    // エラーが発生しても続行（オプショナルなので）
    next();
  }
};