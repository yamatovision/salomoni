import { OrganizationModel } from '../models/organization.model';
import { 
  Organization, 
  OrganizationUpdateRequest,
  PaginationParams,
  OrganizationStatus,
  OrganizationPlan
} from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';

export class OrganizationRepository {
  /**
   * 組織を作成
   */
  async create(data: Partial<Organization> & { name: string; email: string; ownerId: string }): Promise<Organization> {
    try {
      logger.info('Creating new organization', { name: data.name, email: data.email });
      
      const organization = new OrganizationModel(data);
      const saved = await organization.save();
      
      logger.info('Organization created successfully', { 
        organizationId: saved.id, 
        name: saved.name 
      });
      
      return saved.toJSON() as Organization;
    } catch (error) {
      logger.error('Failed to create organization', { error, data });
      
      if ((error as any).code === 11000) {
        throw new AppError(409, '既に登録されているメールアドレスです', 'DUPLICATE_EMAIL');
      }
      
      throw error;
    }
  }

  /**
   * IDで組織を検索
   */
  async findById(id: string): Promise<Organization | null> {
    try {
      const organization = await OrganizationModel.findById(id);
      return organization ? organization.toJSON() as Organization : null;
    } catch (error) {
      logger.error('Failed to find organization by ID', { error, id });
      throw error;
    }
  }

  /**
   * メールアドレスで組織を検索
   */
  async findByEmail(email: string): Promise<Organization | null> {
    try {
      const organization = await (OrganizationModel as any).findByEmail(email);
      return organization ? organization.toJSON() as Organization : null;
    } catch (error) {
      logger.error('Failed to find organization by email', { error, email });
      throw error;
    }
  }

  /**
   * 組織を更新
   */
  async update(id: string, data: Partial<OrganizationUpdateRequest>): Promise<Organization | null> {
    try {
      logger.info('Updating organization', { organizationId: id });
      
      const organization = await OrganizationModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      
      if (!organization) {
        return null;
      }
      
      logger.info('Organization updated successfully', { organizationId: id });
      return organization.toJSON() as Organization;
    } catch (error) {
      logger.error('Failed to update organization', { error, id, data });
      throw error;
    }
  }

  /**
   * 組織を削除（論理削除）
   */
  async delete(id: string): Promise<boolean> {
    try {
      logger.info('Deleting organization', { organizationId: id });
      
      const organization = await OrganizationModel.findByIdAndUpdate(
        id,
        { status: OrganizationStatus.CANCELED },
        { new: true }
      );
      
      if (!organization) {
        return false;
      }
      
      logger.info('Organization deleted successfully', { organizationId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete organization', { error, id });
      throw error;
    }
  }

  /**
   * 組織一覧を取得（ページネーション付き）
   */
  async findAll(params: {
    pagination: PaginationParams;
    filters?: {
      status?: OrganizationStatus;
      plan?: OrganizationPlan;
      search?: string;
    };
  }): Promise<{
    organizations: Organization[];
    total: number;
  }> {
    try {
      const { page = 1, limit = 20 } = params.pagination;
      const skip = (page - 1) * limit;
      
      // フィルタ条件の構築
      const query: any = {};
      
      if (params.filters?.status) {
        query.status = params.filters.status;
      }
      
      if (params.filters?.plan) {
        query.plan = params.filters.plan;
      }
      
      if (params.filters?.search) {
        query.$or = [
          { name: { $regex: params.filters.search, $options: 'i' } },
          { displayName: { $regex: params.filters.search, $options: 'i' } },
          { email: { $regex: params.filters.search, $options: 'i' } },
        ];
      }
      
      // 並列実行でデータ取得と件数カウント
      const [organizations, total] = await Promise.all([
        OrganizationModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        OrganizationModel.countDocuments(query),
      ]);
      
      return {
        organizations: organizations.map(org => org.toJSON() as Organization),
        total,
      };
    } catch (error) {
      logger.error('Failed to find organizations', { error, params });
      throw error;
    }
  }

  /**
   * オーナーIDで組織を検索
   */
  async findByOwnerId(ownerId: string): Promise<Organization | null> {
    try {
      const organization = await OrganizationModel.findOne({ ownerId });
      return organization ? organization.toJSON() as Organization : null;
    } catch (error) {
      logger.error('Failed to find organization by owner ID', { error, ownerId });
      throw error;
    }
  }

  /**
   * 組織のステータスを変更
   */
  async changeStatus(id: string, status: OrganizationStatus, reason?: string): Promise<Organization | null> {
    try {
      logger.info('Changing organization status', { organizationId: id, status, reason });
      
      const organization = await OrganizationModel.findById(id);
      if (!organization) {
        return null;
      }
      
      if (status === OrganizationStatus.SUSPENDED) {
        await (organization as any).suspend(reason);
      } else if (status === OrganizationStatus.ACTIVE) {
        await (organization as any).activate();
      } else {
        organization.status = status;
        await organization.save();
      }
      
      logger.info('Organization status changed successfully', { organizationId: id, status });
      return organization.toJSON() as Organization;
    } catch (error) {
      logger.error('Failed to change organization status', { error, id, status });
      throw error;
    }
  }

  /**
   * 組織のプランを変更
   */
  async changePlan(id: string, plan: OrganizationPlan): Promise<Organization | null> {
    try {
      logger.info('Changing organization plan', { organizationId: id, plan });
      
      const organization = await OrganizationModel.findByIdAndUpdate(
        id,
        { plan },
        { new: true, runValidators: true }
      );
      
      if (!organization) {
        return null;
      }
      
      logger.info('Organization plan changed successfully', { organizationId: id, plan });
      return organization.toJSON() as Organization;
    } catch (error) {
      logger.error('Failed to change organization plan', { error, id, plan });
      throw error;
    }
  }

  /**
   * アクティブな組織数を取得
   */
  async countActive(): Promise<number> {
    try {
      return await OrganizationModel.countDocuments({ status: OrganizationStatus.ACTIVE });
    } catch (error) {
      logger.error('Failed to count active organizations', { error });
      throw error;
    }
  }
}