import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../../../common/middleware/errorHandler';
import { 
  AuthMethod,
  type AuthRequest, 
  type OrganizationRegisterRequest,
  type ApiResponse
} from '../../../types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * ログイン
   * POST /api/auth/login
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authRequest: AuthRequest = {
        ...req.body,
        platform: req.get('x-platform') || 'web',
        userAgent: req.get('user-agent'),
      };

      const result = await this.authService.login(authRequest);

      // リフレッシュトークンをHttpOnly Cookieに設定
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: authRequest.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 14 * 24 * 60 * 60 * 1000,
      });

      // レスポンスからリフレッシュトークンを除外
      const response: ApiResponse<any> = {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * LINE認証ログイン
   * POST /api/auth/login-line
   */
  loginLine = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authRequest: AuthRequest = {
        method: AuthMethod.LINE,
        token: req.body.token,
      };

      const result = await this.authService.login(authRequest);

      // モバイルアプリの場合はトークンをレスポンスに含める
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * LINE認証コールバック
   * POST /api/auth/line-callback
   */
  lineCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code, state } = req.body;
      
      if (!code) {
        throw new AppError('LINE認証コードが必要です', 400, 'AUTH001');
      }

      const result = await this.authService.lineCallback(code, state);

      // リフレッシュトークンをHttpOnly Cookieに設定
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14日間
      });

      // レスポンスからリフレッシュトークンを除外
      const response: ApiResponse<any> = {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 組織登録
   * POST /api/auth/register-organization
   */
  registerOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { organization, owner } = req.body;
      
      const registerRequest: OrganizationRegisterRequest = {
        organizationName: organization.name,
        organizationPhone: organization.phone,
        organizationAddress: organization.address,
        ownerName: owner.name,
        ownerEmail: owner.email,
        ownerPassword: owner.password,
        ownerPhone: owner.phone,
        plan: organization.plan || 'standard',
        billingEmail: organization.email,
      };

      const result = await this.authService.registerOrganization(registerRequest);

      // リフレッシュトークンをHttpOnly Cookieに設定
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      // レスポンスからリフレッシュトークンを除外
      const response: ApiResponse<any> = {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        }
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * トークンリフレッシュ
   * POST /api/auth/refresh
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // リフレッシュトークンをCookieまたはボディから取得
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        throw new AppError('リフレッシュトークンが提供されていません', 401, 'AUTH001');
      }

      const result = await this.authService.refreshToken({ refreshToken });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ログアウト
   * POST /api/auth/logout
   */
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      await this.authService.logout(userId, refreshToken);

      // Cookieをクリア
      res.clearCookie('refreshToken');

      res.json({ success: true, data: { message: 'ログアウトしました' } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 招待トークン検証
   * GET /api/auth/verify-invite
   */
  verifyInvite = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        throw new AppError('招待トークンが必要です', 400, 'INVALID_TOKEN');
      }

      // TODO: 招待トークンの検証処理
      // const inviteInfo = await this.authService.verifyInviteToken(token);

      res.json({
        success: true,
        data: {
          message: '招待トークンの検証機能は実装中です',
          token,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 招待承認・初回登録完了
   * POST /api/auth/complete-registration
   */
  completeRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, name, password, birthDate, gender } = req.body;

      const result = await this.authService.completeRegistration({
        token,
        name,
        password,
        birthDate,
        gender,
      });

      // リフレッシュトークンをHttpOnly Cookieに設定
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      // レスポンスからリフレッシュトークンを除外
      const response: ApiResponse<any> = {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        }
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * パスワードリセットリクエスト
   * POST /api/auth/password-reset-request
   */
  passwordResetRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      // 未使用変数の警告を回避
      void email;

      // TODO: パスワードリセット処理
      // await this.authService.requestPasswordReset(email);

      // セキュリティのため、メールアドレスの存在有無に関わらず同じレスポンスを返す
      res.json({
        success: true,
        data: {
          message: 'パスワードリセットメールを送信しました（該当するアカウントが存在する場合）',
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * パスワードリセットトークン検証
   * POST /api/auth/verify-reset-token
   */
  verifyResetToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.body;
      // 未使用変数の警告を回避
      void token;

      // TODO: トークン検証処理
      // const isValid = await this.authService.verifyResetToken(token);

      res.json({
        success: true,
        data: {
          message: 'パスワードリセット機能は実装中です',
          valid: false,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * パスワードリセット完了
   * POST /api/auth/complete-password-reset
   */
  completePasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      // 未使用変数の警告を回避
      void token;
      void newPassword;

      // TODO: パスワードリセット完了処理
      // await this.authService.completePasswordReset(token, newPassword);

      res.json({
        success: true,
        data: {
          message: 'パスワードリセット機能は実装中です',
        }
      });
    } catch (error) {
      next(error);
    }
  };
}