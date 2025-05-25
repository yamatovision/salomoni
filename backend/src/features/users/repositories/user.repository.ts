import { UserModel } from '../models/user.model';
import { 
  UserProfile, 
  UserCreateRequest,
  UserUpdateRequest,
  UserRole,
  UserStatus,
  PaginationParams
} from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';

export class UserRepository {
  /**
   * ユーザーを作成
   */
  async create(data: UserCreateRequest & { organizationId?: string }): Promise<UserProfile> {
    try {
      logger.info('Creating new user', { email: data.email, role: data.role });
      
      const user = new UserModel(data);
      const saved = await user.save();
      
      logger.info('User created successfully', { 
        userId: saved.id, 
        email: saved.email 
      });
      
      return saved.toJSON() as UserProfile;
    } catch (error) {
      logger.error('Failed to create user', { error, email: data.email });
      
      if ((error as any).code === 11000) {
        const field = Object.keys((error as any).keyPattern)[0];
        if (field === 'email') {
          throw new AppError(409, '既に登録されているメールアドレスです', 'DUPLICATE_EMAIL');
        } else if (field === 'lineUserId') {
          throw new AppError(409, '既に登録されているLINEアカウントです', 'DUPLICATE_LINE_ID');
        }
      }
      
      throw error;
    }
  }

  /**
   * IDでユーザーを検索
   */
  async findById(id: string, includePassword = false): Promise<UserProfile | null> {
    try {
      let query = UserModel.findById(id);
      if (includePassword) {
        query = (query as any).select('+password');
      }
      
      const user = await query;
      return user ? user.toJSON() as UserProfile : null;
    } catch (error) {
      logger.error('Failed to find user by ID', { error, id });
      throw error;
    }
  }

  /**
   * メールアドレスでユーザーを検索
   */
  async findByEmail(email: string, includePassword = false): Promise<UserProfile | null> {
    try {
      let query = (UserModel as any).findByEmail(email);
      if (!includePassword) {
        query = query.select('-password');
      }
      
      const user = await query;
      return user ? user.toJSON() as UserProfile : null;
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw error;
    }
  }

  /**
   * LINE UserIDでユーザーを検索
   */
  async findByLineUserId(lineUserId: string): Promise<UserProfile | null> {
    try {
      const user = await (UserModel as any).findByLineUserId(lineUserId);
      return user ? user.toJSON() as UserProfile : null;
    } catch (error) {
      logger.error('Failed to find user by LINE user ID', { error, lineUserId });
      throw error;
    }
  }

  /**
   * ユーザーを更新
   */
  async update(id: string, data: Partial<UserUpdateRequest>): Promise<UserProfile | null> {
    try {
      logger.info('Updating user', { userId: id });
      
      const user = await UserModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      
      if (!user) {
        return null;
      }
      
      logger.info('User updated successfully', { userId: id });
      return user.toJSON() as UserProfile;
    } catch (error) {
      logger.error('Failed to update user', { error, id, data });
      throw error;
    }
  }

  /**
   * ユーザーを削除（論理削除）
   */
  async delete(id: string): Promise<boolean> {
    try {
      logger.info('Deleting user', { userId: id });
      
      const user = await UserModel.findByIdAndUpdate(
        id,
        { status: UserStatus.INACTIVE },
        { new: true }
      );
      
      if (!user) {
        return false;
      }
      
      logger.info('User deleted successfully', { userId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete user', { error, id });
      throw error;
    }
  }

  /**
   * ユーザー一覧を取得（ページネーション付き）
   */
  async findAll(params: {
    pagination: PaginationParams;
    filters?: {
      organizationId?: string;
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    };
  }): Promise<{
    users: UserProfile[];
    total: number;
  }> {
    try {
      const { page = 1, limit = 20 } = params.pagination;
      const skip = (page - 1) * limit;
      
      // フィルタ条件の構築
      const query: any = {};
      
      if (params.filters?.organizationId) {
        query.organizationId = params.filters.organizationId;
      }
      
      if (params.filters?.role) {
        query.role = params.filters.role;
      }
      
      if (params.filters?.status) {
        query.status = params.filters.status;
      }
      
      if (params.filters?.search) {
        query.$or = [
          { name: { $regex: params.filters.search, $options: 'i' } },
          { nameKana: { $regex: params.filters.search, $options: 'i' } },
          { email: { $regex: params.filters.search, $options: 'i' } },
          { employeeNumber: { $regex: params.filters.search, $options: 'i' } },
        ];
      }
      
      // 並列実行でデータ取得と件数カウント
      const [users, total] = await Promise.all([
        UserModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        UserModel.countDocuments(query),
      ]);
      
      return {
        users: users.map(user => user.toJSON() as UserProfile),
        total,
      };
    } catch (error) {
      logger.error('Failed to find users', { error, params });
      throw error;
    }
  }

  /**
   * パスワードを検証
   */
  async verifyPassword(email: string, password: string): Promise<UserProfile | null> {
    try {
      const user = await (UserModel as any).findByEmail(email);
      if (!user) {
        return null;
      }
      
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return null;
      }
      
      return user.toJSON() as UserProfile;
    } catch (error) {
      logger.error('Failed to verify password', { error, email });
      throw error;
    }
  }

  /**
   * 最終ログイン時刻を更新
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const user = await UserModel.findById(id);
      if (user) {
        await (user as any).updateLastLogin();
      }
    } catch (error) {
      logger.error('Failed to update last login', { error, id });
      throw error;
    }
  }

  /**
   * ユーザーのステータスを変更
   */
  async changeStatus(id: string, status: UserStatus): Promise<UserProfile | null> {
    try {
      logger.info('Changing user status', { userId: id, status });
      
      const user = await UserModel.findById(id);
      if (!user) {
        return null;
      }
      
      if (status === UserStatus.SUSPENDED) {
        await (user as any).suspend();
      } else if (status === UserStatus.ACTIVE) {
        await (user as any).activate();
      } else {
        user.status = status;
        await user.save();
      }
      
      logger.info('User status changed successfully', { userId: id, status });
      return user.toJSON() as UserProfile;
    } catch (error) {
      logger.error('Failed to change user status', { error, id, status });
      throw error;
    }
  }

  /**
   * ユーザーのロールを更新
   */
  async updateRoles(id: string, roles: UserRole[]): Promise<UserProfile | null> {
    try {
      logger.info('Updating user roles', { userId: id, roles });
      
      const user = await UserModel.findByIdAndUpdate(
        id,
        { role: roles[0] },
        { new: true, runValidators: true }
      );
      
      if (!user) {
        return null;
      }
      
      logger.info('User roles updated successfully', { userId: id, roles });
      return user.toJSON() as UserProfile;
    } catch (error) {
      logger.error('Failed to update user roles', { error, id, roles });
      throw error;
    }
  }

  /**
   * リフレッシュトークンを保存
   */
  async saveRefreshToken(userId: string, token: string, expiresAt: Date, userAgent?: string, platform?: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $push: {
          refreshTokens: {
            token,
            createdAt: new Date(),
            expiresAt,
            userAgent,
            platform,
          }
        }
      });
    } catch (error) {
      logger.error('Failed to save refresh token', { error, userId });
      throw error;
    }
  }

  /**
   * リフレッシュトークンを削除
   */
  async removeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $pull: {
          refreshTokens: { token }
        }
      });
    } catch (error) {
      logger.error('Failed to remove refresh token', { error, userId });
      throw error;
    }
  }

  /**
   * 全てのリフレッシュトークンを削除（強制ログアウト）
   */
  async removeAllRefreshTokens(userId: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        refreshTokens: []
      });
    } catch (error) {
      logger.error('Failed to remove all refresh tokens', { error, userId });
      throw error;
    }
  }

  /**
   * 組織内のユーザーを取得
   */
  async findByOrganization(organizationId: string): Promise<UserProfile[]> {
    try {
      const users = await UserModel.find({ 
        organizationId,
        status: UserStatus.ACTIVE,
        role: { $ne: 'client' as UserRole }
      });
      return users.map(user => user.toJSON() as UserProfile);
    } catch (error) {
      logger.error('Failed to find users by organization', { error, organizationId });
      throw error;
    }
  }

  /**
   * 組織内のアクティブユーザー数を取得
   */
  async countActiveByOrganization(organizationId: string): Promise<number> {
    try {
      return await UserModel.countDocuments({ 
        organizationId, 
        status: UserStatus.ACTIVE 
      });
    } catch (error) {
      logger.error('Failed to count active users', { error, organizationId });
      throw error;
    }
  }

  /**
   * パスワードをハッシュ化
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}