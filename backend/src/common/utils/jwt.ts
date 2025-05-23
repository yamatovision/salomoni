import jwt from 'jsonwebtoken';
import type { JWTPayload } from '../middleware/auth';
import { logger } from './logger';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;
  private refreshTokenExpiryRemember: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '';
    this.accessTokenExpiry = '30m'; // 30分
    this.refreshTokenExpiry = '14d'; // 14日
    this.refreshTokenExpiryRemember = '30d'; // 30日（ログイン維持時）

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets are not configured');
    }
  }

  /**
   * アクセストークンとリフレッシュトークンのペアを生成
   */
  generateTokenPair(payload: JWTPayload, rememberMe = false): TokenPair {
    try {
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload, rememberMe);
      
      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Failed to generate token pair', { error });
      throw error;
    }
  }

  /**
   * アクセストークンを生成
   */
  generateAccessToken(payload: JWTPayload): string {
    // 新しいトークンが確実に生成されるように現在のタイムスタンプを追加
    const tokenPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000), // 現在時刻を明示的に設定
      jti: Math.random().toString(36).substring(2), // ランダムなJWT IDを追加
    };
    
    return jwt.sign(tokenPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'salomoni',
      audience: 'salomoni-api',
      noTimestamp: false, // タイムスタンプを有効にする
    } as jwt.SignOptions);
  }

  /**
   * リフレッシュトークンを生成
   */
  generateRefreshToken(payload: JWTPayload, rememberMe = false): string {
    const expiresIn = rememberMe ? this.refreshTokenExpiryRemember : this.refreshTokenExpiry;
    
    return jwt.sign(
      { 
        userId: payload.userId,
        sessionId: payload.sessionId,
        type: 'refresh' 
      },
      this.refreshTokenSecret,
      {
        expiresIn,
        issuer: 'salomoni',
        audience: 'salomoni-api',
      } as jwt.SignOptions
    );
  }

  /**
   * アクセストークンを検証
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'salomoni',
        audience: 'salomoni-api',
      }) as JWTPayload;
      
      return payload;
    } catch (error) {
      logger.error('Failed to verify access token', { error });
      throw error;
    }
  }

  /**
   * リフレッシュトークンを検証
   */
  verifyRefreshToken(token: string): { userId: string; sessionId: string } {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'salomoni',
        audience: 'salomoni-api',
      }) as any;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return {
        userId: payload.userId,
        sessionId: payload.sessionId,
      };
    } catch (error) {
      logger.error('Failed to verify refresh token', { error });
      throw error;
    }
  }

  /**
   * トークンの有効期限を取得
   */
  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get token expiry', { error });
      return null;
    }
  }

  /**
   * リフレッシュトークンの有効期限を計算
   */
  calculateRefreshTokenExpiry(rememberMe = false): Date {
    const days = rememberMe ? 30 : 14;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }

  /**
   * 任意のJWTトークンをデコード（検証なし）
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Failed to decode token', { error });
      return null;
    }
  }
}

export const jwtService = new JWTService();