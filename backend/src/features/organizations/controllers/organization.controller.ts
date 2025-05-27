import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organization.service';
import { AppError } from '../../../common/middleware/errorHandler';
import { 
  PaginationParams,
  OrganizationStatus,
  OrganizationPlan,
  ApiResponse,
  UserRole,
  AuthMethod
} from '../../../types';

export class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

  /**
   * 組織とオーナーを同時に作成（SuperAdmin用）
   * POST /api/organizations/create-with-owner
   */
  createOrganizationWithOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        name,
        ownerName,
        ownerEmail,
        ownerPassword,
        phone,
        address,
        plan,
        status,
        tokenLimit
      } = req.body;

      // パスワードの検証
      if (!ownerPassword || ownerPassword.length < 8) {
        throw new AppError('パスワードは8文字以上で設定してください', 400, 'VALIDATION_ERROR');
      }

      const result = await this.organizationService.createOrganizationWithOwner({
        organization: {
          name,
          email: ownerEmail, // billing用のメールはオーナーと同じ
          phone: phone || '',
          address: address || '',
          plan,
          tokenLimit
        },
        owner: {
          name: ownerName,
          email: ownerEmail,
          password: ownerPassword,
          role: UserRole.OWNER,
          authMethods: [AuthMethod.EMAIL]
        }
      });

      // statusを組織作成後に設定する場合
      if (status && status !== OrganizationStatus.ACTIVE) {
        await this.organizationService.updateOrganization(result.organization.id, { status });
      }

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
   * 組織一覧取得
   * GET /api/organizations
   */
  getOrganizations = async (
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
        status: req.query.status as OrganizationStatus,
        plan: req.query.plan as OrganizationPlan,
        search: req.query.search as string,
      };

      const result = await this.organizationService.getOrganizations({
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
   * 組織詳細取得
   * GET /api/organizations/:id
   */
  getOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('組織IDが必須です', 400, 'VALIDATION_ERROR');
      }
      const organization = await this.organizationService.getOrganization(id);

      const response: ApiResponse<typeof organization> = {
        success: true,
        data: organization,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 組織更新
   * PUT /api/organizations/:id
   */
  updateOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('組織IDが必須です', 400, 'VALIDATION_ERROR');
      }
      const organization = await this.organizationService.updateOrganization(id, req.body);

      const response: ApiResponse<typeof organization> = {
        success: true,
        data: organization,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 組織削除
   * DELETE /api/organizations/:id
   */
  deleteOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('組織IDが必須です', 400, 'VALIDATION_ERROR');
      }
      await this.organizationService.deleteOrganization(id);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: '組織を削除しました' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 組織統計情報取得
   * GET /api/organizations/:id/stats
   */
  getOrganizationStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('組織IDが必須です', 400, 'VALIDATION_ERROR');
      }
      const stats = await this.organizationService.getOrganizationStats(id);

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 組織ステータス変更
   * PATCH /api/organizations/:id/status
   */
  changeOrganizationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        throw new AppError('ステータスは必須です', 400, 'VALIDATION_ERROR');
      }

      if (!id) {
        throw new AppError('組織IDが必須です', 400, 'VALIDATION_ERROR');
      }

      const organization = await this.organizationService.changeOrganizationStatus(
        id,
        status,
        reason
      );

      const response: ApiResponse<typeof organization> = {
        success: true,
        data: organization,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 組織プラン変更
   * PATCH /api/organizations/:id/plan
   */
  changeOrganizationPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { plan, immediate } = req.body;

      if (!plan) {
        throw new AppError('プランは必須です', 400, 'VALIDATION_ERROR');
      }

      if (!id) {
        throw new AppError('組織IDが必須です', 400, 'VALIDATION_ERROR');
      }

      const organization = await this.organizationService.changeOrganizationPlan(
        id,
        plan,
        immediate
      );

      const response: ApiResponse<typeof organization> = {
        success: true,
        data: organization,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}