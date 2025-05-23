import { v4 as uuidv4 } from 'uuid';
import { 
  AuthRequest, 
  AuthResponse, 
  OrganizationRegisterRequest,
  TokenRefreshResponse,
  UserRole,
  AuthMethod,
  OrganizationStatus,
  UserStatus
} from '../../../types';
import type { JWTPayload } from '../../../common/middleware/auth';
import { UserRepository } from '../../users/repositories/user.repository';
import { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import { InviteTokenModel } from '../models/invite-token.model';
import { jwtService } from '../../../common/utils/jwt';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';
import axios from 'axios';

export class AuthService {
  private userRepository: UserRepository;
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  /**
   * ログイン処理（メール/パスワード）
   */
  async login(request: AuthRequest): Promise<AuthResponse> {
    try {
      if (request.method === AuthMethod.EMAIL) {
        return await this.emailLogin(request);
      } else if (request.method === AuthMethod.LINE) {
        return await this.lineLogin(request);
      } else {
        throw new AppError(400, '不正な認証方法です', 'AUTH001');
      }
    } catch (error) {
      logger.error('Login failed', { error, method: request.method });
      throw error;
    }
  }

  /**
   * メールログイン
   */
  private async emailLogin(request: AuthRequest): Promise<AuthResponse> {
    const { email, password, rememberMe } = request;
    
    if (!email || !password) {
      throw new AppError(400, 'メールアドレスとパスワードは必須です', 'AUTH001');
    }

    // ユーザー検証
    const user = await this.userRepository.verifyPassword(email, password);
    if (!user) {
      throw new AppError(401, 'メールアドレスまたはパスワードが正しくありません', 'AUTH002');
    }

    // ステータスチェック
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(403, 'アカウントが無効化されています', 'AUTH006');
    }

    // 組織ステータスチェック（SuperAdmin以外）
    if (user.role !== UserRole.SUPER_ADMIN && user.organizationId) {
      const organization = await this.organizationRepository.findById(user.organizationId);
      if (!organization || organization.status !== OrganizationStatus.ACTIVE) {
        throw new AppError(403, '所属組織が無効化されています', 'AUTH007');
      }
    }

    // トークン生成
    const sessionId = uuidv4();
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roles: [user.role],
      organizationId: user.organizationId || '',
      sessionId,
      currentRole: user.role,
      platform: 'web',
    };

    const { accessToken, refreshToken } = jwtService.generateTokenPair(payload, rememberMe);

    // リフレッシュトークンを保存
    const expiresAt = jwtService.calculateRefreshTokenExpiry(rememberMe);
    await this.userRepository.saveRefreshToken(
      user.id,
      refreshToken,
      expiresAt,
      undefined,
      'web'
    );

    // 最終ログイン時刻を更新
    await this.userRepository.updateLastLogin(user.id);

    logger.info('Email login successful', { 
      userId: user.id, 
      email: user.email,
      platform: 'web' 
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId || '',
        profileImage: user.profileImage || '',
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }

  /**
   * LINE認証ログイン
   */
  private async lineLogin(request: AuthRequest): Promise<AuthResponse> {
    const { token } = request;
    
    if (!token) {
      throw new AppError(400, 'LINE認証トークンは必須です', 'AUTH001');
    }


    // LINE APIでトークンを検証
    const lineProfile = await this.verifyLineToken(token);
    if (!lineProfile) {
      throw new AppError(401, 'LINE認証に失敗しました', 'AUTH002');
    }

    // LINE UserIDでユーザーを検索
    let user = await this.userRepository.findByLineUserId(lineProfile.userId);
    
    if (!user) {
      // 新規ユーザーの場合はエラー（事前登録が必要）
      throw new AppError(404, 'アカウントが見つかりません。管理者に登録を依頼してください', 'AUTH005');
    }

    // ステータスチェック
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(403, 'アカウントが無効化されています', 'AUTH006');
    }

    // 組織ステータスチェック
    if (user.organizationId) {
      const organization = await this.organizationRepository.findById(user.organizationId);
      if (!organization || organization.status !== OrganizationStatus.ACTIVE) {
        throw new AppError(403, '所属組織が無効化されています', 'AUTH007');
      }
    }

    // トークン生成
    const sessionId = uuidv4();
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roles: [user.role],
      organizationId: user.organizationId || '',
      sessionId,
      currentRole: user.role,
      platform: 'mobile',
    };

    const { accessToken, refreshToken } = jwtService.generateTokenPair(payload);

    // リフレッシュトークンを保存
    const expiresAt = jwtService.calculateRefreshTokenExpiry(false);
    await this.userRepository.saveRefreshToken(
      user.id,
      refreshToken,
      expiresAt,
      undefined,
      'mobile'
    );

    // 最終ログイン時刻を更新
    await this.userRepository.updateLastLogin(user.id);

    logger.info('LINE login successful', { 
      userId: user.id, 
      lineUserId: lineProfile.userId 
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId || '',
        profileImage: user.profileImage || lineProfile.pictureUrl || '',
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }

  /**
   * LINE APIでトークンを検証
   */
  private async verifyLineToken(token: string): Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
  } | null> {
    try {
      const response = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
        params: {
          access_token: token,
        },
      });

      if (response.data.expires_in <= 0) {
        return null;
      }

      // プロフィール情報を取得
      const profileResponse = await axios.get('https://api.line.me/v2/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        userId: profileResponse.data.userId,
        displayName: profileResponse.data.displayName,
        pictureUrl: profileResponse.data.pictureUrl,
      };
    } catch (error) {
      logger.error('LINE token verification failed', { error });
      return null;
    }
  }

  /**
   * LINE認証コールバック処理（認証コードをトークンに交換）
   */
  async lineCallback(code: string, state?: string): Promise<AuthResponse> {
    try {
      logger.info('LINE callback processing', { code: code.substring(0, 10) + '...', state });

      if (!code) {
        throw new AppError(400, 'LINE認証コードが必要です', 'AUTH001');
      }

      // LINE認証コードをアクセストークンに交換
      const lineTokens = await this.exchangeLineCodeForToken(code);
      if (!lineTokens) {
        throw new AppError(401, 'LINE認証に失敗しました', 'AUTH002');
      }

      // IDトークンからユーザー情報を取得
      const lineProfile = await this.decodeLineIdToken(lineTokens.id_token);
      if (!lineProfile) {
        throw new AppError(401, 'LINEユーザー情報の取得に失敗しました', 'AUTH002');
      }

      // LINE UserIDでユーザーを検索
      let user = await this.userRepository.findByLineUserId(lineProfile.sub);
      
      if (!user) {
        // 新規ユーザーの場合はエラー（事前登録が必要）
        throw new AppError(404, 'アカウントが見つかりません。管理者に登録を依頼してください', 'AUTH005');
      }

      // ステータスチェック
      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(403, 'アカウントが無効化されています', 'AUTH006');
      }

      // 組織ステータスチェック
      if (user.organizationId) {
        const organization = await this.organizationRepository.findById(user.organizationId);
        if (!organization || organization.status !== OrganizationStatus.ACTIVE) {
          throw new AppError(403, '所属組織が無効化されています', 'AUTH007');
        }
      }

      // トークン生成
      const sessionId = uuidv4();
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        roles: [user.role],
        organizationId: user.organizationId || '',
        sessionId,
        currentRole: user.role,
        platform: 'web', // フロントエンドからのコールバックはweb扱い
      };

      const { accessToken, refreshToken } = jwtService.generateTokenPair(payload);

      // リフレッシュトークンを保存
      const expiresAt = jwtService.calculateRefreshTokenExpiry(false);
      await this.userRepository.saveRefreshToken(
        user.id,
        refreshToken,
        expiresAt,
        undefined,
        'web'
      );

      // 最終ログイン時刻を更新
      await this.userRepository.updateLastLogin(user.id);

      logger.info('LINE callback login successful', { 
        userId: user.id, 
        lineUserId: lineProfile.sub 
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId || '',
          profileImage: user.profileImage || lineProfile.picture || '',
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      logger.error('LINE callback processing failed', { error });
      throw error;
    }
  }

  /**
   * LINE認証コードをトークンに交換
   */
  private async exchangeLineCodeForToken(code: string): Promise<{
    access_token: string;
    id_token: string;
    refresh_token?: string;
  } | null> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_REDIRECT_URI || '',
        client_id: process.env.LINE_CHANNEL_ID || '',
        client_secret: process.env.LINE_CHANNEL_SECRET || '',
      });

      const response = await axios.post(
        'https://api.line.me/oauth2/v2.1/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        access_token: response.data.access_token,
        id_token: response.data.id_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error) {
      logger.error('LINE code exchange failed', { error });
      return null;
    }
  }

  /**
   * LINE IDトークンをデコード
   */
  private async decodeLineIdToken(idToken: string): Promise<{
    sub: string; // LINE User ID
    name: string;
    picture?: string;
  } | null> {
    try {
      // LINE IDトークンの検証とデコード
      // 本番環境では、LINE Channel IDで発行元を検証すべき
      const decoded = jwtService.decodeToken(idToken);
      
      return {
        sub: decoded.sub,
        name: decoded.name,
        picture: decoded.picture,
      };
    } catch (error) {
      logger.error('LINE ID token decode failed', { error });
      return null;
    }
  }

  /**
   * 組織登録（新規オーナー作成）
   */
  async registerOrganization(request: OrganizationRegisterRequest): Promise<AuthResponse> {
    try {
      logger.info('Registering new organization', { 
        organizationName: request.organizationName,
        ownerEmail: request.ownerEmail 
      });

      // メールアドレスの重複チェック
      const existingUser = await this.userRepository.findByEmail(request.ownerEmail);
      if (existingUser) {
        throw new AppError(409, '既に登録されているメールアドレスです', 'DUPLICATE_EMAIL');
      }

      const billingEmail = request.billingEmail || request.ownerEmail;
      const existingOrg = await this.organizationRepository.findByEmail(billingEmail);
      if (existingOrg) {
        throw new AppError(409, '既に登録されている組織メールアドレスです', 'DUPLICATE_ORG_EMAIL');
      }

      // オーナーユーザーを作成
      const ownerData: any = {
        email: request.ownerEmail,
        name: request.ownerName,
        password: request.ownerPassword,
        role: UserRole.OWNER,
        authMethods: [AuthMethod.EMAIL],
      };

      // 電話番号が提供されている場合のみ追加
      if (request.ownerPhone) {
        ownerData.phone = request.ownerPhone;
      }

      const owner = await this.userRepository.create(ownerData);

      // 組織を作成
      const organizationData: any = {
        name: request.organizationName,
        displayName: request.organizationDisplayName || request.organizationName,
        email: billingEmail,
        phone: request.organizationPhone || '',
        address: request.organizationAddress || '',
        ownerId: owner.id,
        status: OrganizationStatus.ACTIVE,
        plan: request.plan,
      };

      const organization = await this.organizationRepository.create(organizationData);

      // オーナーに組織IDを設定
      await this.userRepository.update(owner.id, {
        organizationId: organization.id,
      });

      // 自動ログイン用のトークンを生成
      const sessionId = uuidv4();
      const payload: JWTPayload = {
        userId: owner.id,
        email: owner.email,
        roles: [UserRole.OWNER],
        organizationId: organization.id,
        sessionId,
        currentRole: UserRole.OWNER,
        platform: 'web',
      };

      const { accessToken, refreshToken } = jwtService.generateTokenPair(payload);

      // リフレッシュトークンを保存
      const expiresAt = jwtService.calculateRefreshTokenExpiry(false);
      await this.userRepository.saveRefreshToken(
        owner.id,
        refreshToken,
        expiresAt,
        undefined,
        'web'
      );

      logger.info('Organization registration successful', {
        organizationId: organization.id,
        ownerId: owner.id,
      });

      return {
        user: {
          id: owner.id,
          email: owner.email,
          name: owner.name,
          role: owner.role,
          organizationId: organization.id,
          profileImage: owner.profileImage || '',
          status: owner.status,
          createdAt: owner.createdAt,
          updatedAt: owner.updatedAt,
        },
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      logger.error('Organization registration failed', { error });
      throw error;
    }
  }

  /**
   * トークンリフレッシュ
   */
  async refreshToken(request: { refreshToken: string }): Promise<TokenRefreshResponse> {
    try {
      const { refreshToken } = request;

      // リフレッシュトークンを検証
      const payload = jwtService.verifyRefreshToken(refreshToken);

      // ユーザー情報を取得
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new AppError(401, 'ユーザーが見つかりません', 'AUTH002');
      }

      // ステータスチェック
      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(403, 'アカウントが無効化されています', 'AUTH006');
      }

      // 新しいアクセストークンを生成
      const newPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        roles: [user.role],
        organizationId: user.organizationId || '',
        sessionId: payload.sessionId,
        currentRole: user.role,
        platform: 'web',
      };

      const accessToken = jwtService.generateAccessToken(newPayload);

      logger.info('Token refreshed successfully', { userId: user.id });

      return {
        accessToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      // エラーの種類に応じて適切なステータスコードを返す
      if (error instanceof AppError) {
        throw error;
      }
      // JWTエラーの場合は401を返す
      throw new AppError(401, 'トークンの更新に失敗しました', 'AUTH003');
    }
  }

  /**
   * ログアウト
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        // 特定のリフレッシュトークンのみ削除
        await this.userRepository.removeRefreshToken(userId, refreshToken);
      } else {
        // 全てのリフレッシュトークンを削除（全デバイスからログアウト）
        await this.userRepository.removeAllRefreshTokens(userId);
      }

      logger.info('Logout successful', { userId });
    } catch (error) {
      logger.error('Logout failed', { error, userId });
      throw error;
    }
  }

  /**
   * 強制ログアウト
   */
  async forceLogout(userId: string): Promise<void> {
    try {
      await this.userRepository.removeAllRefreshTokens(userId);
      logger.info('Force logout successful', { userId });
    } catch (error) {
      logger.error('Force logout failed', { error, userId });
      throw error;
    }
  }

  /**
   * 招待承認・初回登録完了
   */
  async completeRegistration(request: {
    token: string;
    name: string;
    password: string;
    birthDate?: string;
    gender?: string;
  }): Promise<AuthResponse> {
    try {
      const { token, name, password, birthDate, gender } = request;

      // 招待トークンを検証
      const inviteToken = await InviteTokenModel.findValidToken(token);
      if (!inviteToken) {
        throw new AppError(401, '招待トークンが無効または期限切れです', 'AUTH004');
      }

      // メールアドレスの重複チェック
      const existingUser = await this.userRepository.findByEmail(inviteToken.email);
      if (existingUser) {
        throw new AppError(409, '既に登録されているメールアドレスです', 'DUPLICATE_EMAIL');
      }

      // 組織の存在確認
      const organizationId = inviteToken.organizationId.toString();
      const organization = await this.organizationRepository.findById(organizationId);
      if (!organization || organization.status !== OrganizationStatus.ACTIVE) {
        throw new AppError(403, '招待元の組織が無効化されています', 'AUTH007');
      }

      // ユーザーを作成
      const userData: any = {
        email: inviteToken.email,
        name,
        password,
        role: inviteToken.role,
        organizationId: organizationId,
        status: UserStatus.ACTIVE,
        authMethods: [AuthMethod.EMAIL],
      };

      if (birthDate) {
        userData.birthDate = new Date(birthDate);
      }
      if (gender) {
        userData.gender = gender;
      }

      const user = await this.userRepository.create(userData);

      // 招待トークンを使用済みにする
      await inviteToken.markAsUsed();

      // 自動ログイン用のトークンを生成
      const sessionId = uuidv4();
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        roles: [user.role],
        organizationId: user.organizationId || '',
        sessionId,
        currentRole: user.role,
        platform: 'web',
      };

      const { accessToken, refreshToken } = jwtService.generateTokenPair(payload);

      // リフレッシュトークンを保存
      const expiresAt = jwtService.calculateRefreshTokenExpiry(false);
      await this.userRepository.saveRefreshToken(
        user.id,
        refreshToken,
        expiresAt,
        undefined,
        'web'
      );

      logger.info('User registration via invite completed', {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId || '',
          profileImage: user.profileImage || '',
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      logger.error('Complete registration failed', { error });
      throw error;
    }
  }
}