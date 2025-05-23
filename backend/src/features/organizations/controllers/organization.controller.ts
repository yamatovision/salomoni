import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organization.service';
import { AppError } from '../../../common/middleware/errorHandler';
import type { 
  PaginationParams,
  OrganizationStatus,
  OrganizationPlan,
  ApiResponse
} from '../../../types';

export class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

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
        throw new AppError(400, '組織IDが必須です', 'VALIDATION_ERROR');
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
        throw new AppError(400, '組織IDが必須です', 'VALIDATION_ERROR');
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
        throw new AppError(400, '組織IDが必須です', 'VALIDATION_ERROR');
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
        throw new AppError(400, '組織IDが必須です', 'VALIDATION_ERROR');
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
        throw new AppError(400, 'ステータスは必須です', 'VALIDATION_ERROR');
      }

      if (!id) {
        throw new AppError(400, '組織IDが必須です', 'VALIDATION_ERROR');
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
        throw new AppError(400, 'プランは必須です', 'VALIDATION_ERROR');
      }

      if (!id) {
        throw new AppError(400, '組織IDが必須です', 'VALIDATION_ERROR');
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