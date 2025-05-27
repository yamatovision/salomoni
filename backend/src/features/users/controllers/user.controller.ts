import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { StylistReportService } from '../services/stylist-report.service';
import { AppError } from '../../../common/middleware/errorHandler';
import { logger } from '../../../common/utils/logger';
import type { 
  PaginationParams,
  UserRole,
  UserStatus,
  ApiResponse
} from '../../../types';

export class UserController {
  private userService: UserService;
  private stylistReportService: StylistReportService;

  constructor() {
    this.userService = new UserService();
    this.stylistReportService = new StylistReportService();
  }

  /**
   * 現在のユーザー情報取得
   * GET /api/users/me
   */
  getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      const user = await this.userService.getCurrentUser(userId);

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ユーザー一覧取得
   * GET /api/users
   */
  getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // ページネーションパラメータ
      const pagination: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      // フィルタパラメータ
      const filters = {
        organizationId: req.query.organizationId as string,
        role: req.query.role as UserRole,
        status: req.query.status as UserStatus,
        search: req.query.search as string,
      };

      // 組織境界チェック（SuperAdmin以外は自組織のみ）
      if (!req.user?.roles.includes('superadmin' as UserRole)) {
        filters.organizationId = req.user?.organizationId || '';
      }

      const result = await this.userService.getUsers({
        pagination,
        filters,
      });

      // デバッグログ: ユーザー一覧レスポンス
      console.log('[DEBUG] getUsers レスポンスデータの一部:', {
        totalUsers: result.users.length,
        firstUser: result.users[0] ? {
          id: result.users[0].id,
          email: result.users[0].email,
          birthDate: result.users[0].birthDate,
          hasBirthDate: !!result.users[0].birthDate
        } : null
      });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ユーザー詳細取得
   * GET /api/users/:id
   */
  getUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUser(id || '');

      // 組織境界チェック
      if (!req.user?.roles.includes('superadmin' as UserRole) && 
          user.organizationId !== req.user?.organizationId) {
        throw new AppError('他組織のユーザー情報は参照できません', 403, 'CROSS_ORG_ACCESS');
      }

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ユーザー更新
   * PUT /api/users/:id
   */
  updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      
      if (!currentUserId) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      const user = await this.userService.updateUser(id || '', req.body, currentUserId);

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ユーザー削除
   * DELETE /api/users/:id
   */
  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.userId;
      
      if (!deletedBy) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      await this.userService.deleteUser(id || '', deletedBy);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'ユーザーを削除しました' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ユーザー招待
   * POST /api/users/invite
   */
  inviteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const invitedBy = req.user?.userId;
      const organizationId = req.user?.organizationId;
      
      if (!invitedBy || !organizationId) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      // デバッグログ: 招待リクエストデータ
      console.log('[DEBUG] inviteUser リクエストボディ:', JSON.stringify(req.body, null, 2));
      
      const result = await this.userService.inviteUser(
        req.body,
        organizationId,
        invitedBy
      );

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * パスワード変更
   * POST /api/users/me/password
   */
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      const { currentPassword, newPassword } = req.body;
      await this.userService.changePassword(userId, currentPassword, newPassword);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'パスワードを変更しました' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ユーザーステータス変更
   * PATCH /api/users/:id/status
   */
  changeUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const changedBy = req.user?.userId;
      
      if (!changedBy) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      const user = await this.userService.changeUserStatus(
        id || '',
        status,
        changedBy,
        reason
      );

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ユーザーロール変更
   * PATCH /api/users/:id/roles
   */
  changeUserRoles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { roles } = req.body;
      const changedBy = req.user?.userId;
      
      if (!changedBy) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      if (!Array.isArray(roles) || roles.length === 0) {
        throw new AppError('ロールの配列が必要です', 400, 'VALIDATION_ERROR');
      }

      const user = await this.userService.changeUserRoles(id || '', roles, changedBy);

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 強制ログアウト
   * POST /api/users/:id/force-logout
   */
  forceLogout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // 権限チェックはミドルウェアで実施済み
      const authService = new (await import('../../auth/services/auth.service')).AuthService();
      await authService.forceLogout(id || '');

      const response: ApiResponse<{ message: string; reason?: string }> = {
        success: true,
        data: { 
          message: 'ユーザーを強制ログアウトしました',
          reason 
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * トークン使用量取得
   * GET /api/users/:id/token-usage
   */
  getTokenUsage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      
      // 自分自身または管理者権限が必要
      if (id !== req.user?.userId && 
          !req.user?.roles.some(role => ['superadmin', 'owner', 'admin'].includes(role))) {
        throw new AppError('権限がありません', 403, 'FORBIDDEN');
      }

      // TODO: トークン使用量の実装
      const tokenUsage = {
        userId: id,
        current: 0,
        limit: 10000,
        resetDate: new Date(),
        dailyUsage: [],
      };

      const response: ApiResponse<typeof tokenUsage> = {
        success: true,
        data: tokenUsage,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * スタイリストレポート生成
   * GET /api/admin/stylists/:id/report
   */
  getStylistReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      if (!startDate || !endDate) {
        throw new AppError('startDateとendDateパラメータが必要です', 400, 'VALIDATION_ERROR');
      }

      // 日付パラメータを解析
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new AppError('無効な日付形式です', 400, 'VALIDATION_ERROR');
      }

      if (start > end) {
        throw new AppError('開始日は終了日より前である必要があります', 400, 'VALIDATION_ERROR');
      }

      const report = await this.stylistReportService.generateReport(
        id || '',
        start,
        end,
        organizationId
      );

      const response: ApiResponse<typeof report> = {
        success: true,
        data: report,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * スタイリスト離職リスクサマリー取得
   * GET /api/admin/stylists/risk-summary
   */
  getTurnoverRiskSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info('Fetching turnover risk summary', {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        endpoint: '/api/admin/stylists/risk-summary'
      });

      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw new AppError('認証が必要です', 401, 'AUTH001');
      }

      const summary = await this.userService.getTurnoverRiskSummary(organizationId);

      logger.info('Turnover risk summary fetched successfully', {
        organizationId,
        summary
      });

      const response: ApiResponse<typeof summary> = {
        success: true,
        data: summary,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching turnover risk summary', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });
      next(error);
    }
  };
}