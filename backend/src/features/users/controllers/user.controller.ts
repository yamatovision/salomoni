import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../../../common/middleware/errorHandler';
import type { 
  PaginationParams,
  UserRole,
  UserStatus,
  ApiResponse
} from '../../../types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
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
        throw new AppError(401, '認証が必要です', 'AUTH001');
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
        throw new AppError(403, '他組織のユーザー情報は参照できません', 'CROSS_ORG_ACCESS');
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
        throw new AppError(401, '認証が必要です', 'AUTH001');
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
        throw new AppError(401, '認証が必要です', 'AUTH001');
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
        throw new AppError(401, '認証が必要です', 'AUTH001');
      }

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
        throw new AppError(401, '認証が必要です', 'AUTH001');
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
        throw new AppError(401, '認証が必要です', 'AUTH001');
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
        throw new AppError(401, '認証が必要です', 'AUTH001');
      }

      if (!Array.isArray(roles) || roles.length === 0) {
        throw new AppError(400, 'ロールの配列が必要です', 'VALIDATION_ERROR');
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
        throw new AppError(403, '権限がありません', 'FORBIDDEN');
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
}