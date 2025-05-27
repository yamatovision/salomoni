import { v4 as uuidv4 } from 'uuid';
import { 
  UserProfile,
  UserUpdateRequest,
  PaginationParams,
  PaginationInfo,
  UserRole,
  UserStatus,
  StaffInviteRequest,
  AuthMethod
} from '../../../types';
import { UserRepository } from '../repositories/user.repository';
import { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import { InviteTokenModel } from '../../auth/models/invite-token.model';
import { UserModel } from '../models/user.model';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';
// import { emailService } from '../../../common/services/email.service'; // TODO: メールサービスの実装

export class UserService {
  private userRepository: UserRepository;
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  /**
   * ユーザーを取得
   */
  async getUser(id: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  /**
   * ユーザー一覧を取得
   */
  async getUsers(params: {
    pagination: PaginationParams;
    filters?: {
      organizationId?: string;
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    };
  }): Promise<{
    users: UserProfile[];
    pagination: PaginationInfo;
  }> {
    // ページネーションパラメータのデフォルト値を設定
    const page = params.pagination.page ?? 1;
    const limit = params.pagination.limit ?? 20;
    const normalizedParams = {
      ...params,
      pagination: { page, limit }
    };
    
    const { users, total } = await this.userRepository.findAll(normalizedParams);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    };
  }

  /**
   * ユーザーを更新
   */
  async updateUser(
    id: string,
    data: UserUpdateRequest,
    currentUserId: string
  ): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }

    // 自分自身または管理者権限があるかチェック
    if (id !== currentUserId) {
      const currentUser = await this.userRepository.findById(currentUserId);
      if (!currentUser || !this.hasManagementRole(currentUser)) {
        throw new AppError('権限がありません', 403, 'FORBIDDEN');
      }

      // 組織境界チェック（SuperAdmin以外）
      if (currentUser.role !== UserRole.SUPER_ADMIN && 
          currentUser.organizationId !== user.organizationId) {
        throw new AppError('他組織のユーザーは編集できません', 403, 'CROSS_ORG_ACCESS');
      }
    }

    // パスワードを除外したデータで更新
    const { password, ...updateData } = data;
    
    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new AppError('ユーザーの更新に失敗しました', 500, 'UPDATE_FAILED');
    }

    // パスワードが指定されている場合は別途更新
    if (password) {
      const userDoc = await UserModel.findById(id);
      if (!userDoc) {
        throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
      }
      userDoc.password = password;
      await userDoc.save();
      logger.info('Password updated by admin', { userId: id, updatedBy: currentUserId });
    }

    logger.info('User updated', { userId: id, updatedBy: currentUserId });
    return updatedUser;
  }

  /**
   * ユーザーを招待
   */
  async inviteUser(
    request: StaffInviteRequest & { employeeNumber?: string },
    organizationId: string,
    invitedBy: string
  ): Promise<{ inviteToken?: string; expiresAt?: Date; user?: UserProfile }> {
    // メールアドレスの重複チェック
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new AppError('既に登録されているメールアドレスです', 409, 'DUPLICATE_EMAIL');
    }

    // 組織の存在確認
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new AppError('組織が見つかりません', 404, 'ORG_NOT_FOUND');
    }

    // 組織のユーザー数上限チェック
    const activeUsers = await this.userRepository.countActiveByOrganization(organizationId);
    const maxUsers = organization.settings?.maxUsers || 10;
    if (activeUsers >= maxUsers) {
      throw new AppError('ユーザー数の上限に達しています', 400, 'USER_LIMIT_EXCEEDED');
    }

    // 招待トークンを生成
    const inviteToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

    // 招待トークンを保存
    await InviteTokenModel.create({
      token: inviteToken,
      email: request.email,
      organizationId,
      role: request.role,
      expiresAt,
      used: false,
      createdBy: invitedBy,
      // 追加フィールドを保存
      name: request.name,
      birthDate: request.birthDate,
      phone: request.phone,
      position: request.position,
      password: request.password,
    });

    // TODO: 招待メールを送信
    // await emailService.sendInvitationEmail({
    //   to: request.email,
    //   organizationName: organization.name,
    //   inviteToken,
    //   expiresAt,
    // });

    // パスワードが設定されている場合は、直接ユーザーを作成
    if (request.password) {
      const userData: any = {
        email: request.email,
        name: request.name || request.email.split('@')[0],
        password: request.password,
        role: request.role,
        organizationId: organizationId,
        status: UserStatus.ACTIVE,
        authMethods: [AuthMethod.EMAIL],
      };

      // オプショナルフィールドの設定
      if (request.birthDate) {
        userData.birthDate = new Date(request.birthDate);
      }
      if (request.phone) {
        userData.phone = request.phone;
      }
      if (request.position) {
        userData.position = request.position;
      }
      if (request.employeeNumber) {
        userData.employeeNumber = request.employeeNumber;
      }

      const user = await this.userRepository.create(userData);

      // 招待トークンを使用済みにマーク
      const inviteTokenDoc = await InviteTokenModel.findOne({ token: inviteToken });
      if (inviteTokenDoc) {
        await inviteTokenDoc.markAsUsed();
      }

      logger.info('User created directly with password', {
        userId: user.id,
        email: user.email,
        organizationId,
        invitedBy,
      });

      return { user };
    }

    logger.info('User invited', {
      email: request.email,
      organizationId,
      invitedBy,
      role: request.role,
    });

    return { inviteToken, expiresAt };
  }

  /**
   * パスワードを変更
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId, true);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }

    // UserModelを直接使用してパスワードを検証・更新
    const userDoc = await UserModel.findById(userId).select('+password');
    if (!userDoc) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }

    // 現在のパスワードを検証
    const isValid = await userDoc.comparePassword(currentPassword);
    if (!isValid) {
      throw new AppError('現在のパスワードが正しくありません', 401, 'INVALID_PASSWORD');
    }

    // 新しいパスワードを設定
    userDoc.password = newPassword;
    await userDoc.save();

    logger.info('Password changed', { userId });
  }

  /**
   * ユーザーのステータスを変更
   */
  async changeUserStatus(
    id: string,
    status: UserStatus,
    changedBy: string,
    reason?: string
  ): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }

    // 権限チェック
    const currentUser = await this.userRepository.findById(changedBy);
    if (!currentUser || !this.hasManagementRole(currentUser)) {
      throw new AppError('権限がありません', 403, 'FORBIDDEN');
    }

    // 組織境界チェック
    if (currentUser.role !== UserRole.SUPER_ADMIN && 
        currentUser.organizationId !== user.organizationId) {
      throw new AppError('他組織のユーザーは変更できません', 403, 'CROSS_ORG_ACCESS');
    }

    // 自分自身を無効化できないようにする
    if (id === changedBy && status !== UserStatus.ACTIVE) {
      throw new AppError('自分自身を無効化することはできません', 400, 'SELF_DEACTIVATION');
    }

    const updatedUser = await this.userRepository.changeStatus(id, status);
    if (!updatedUser) {
      throw new AppError('ステータス変更に失敗しました', 500, 'STATUS_CHANGE_FAILED');
    }

    logger.info('User status changed', {
      userId: id,
      oldStatus: user.status,
      newStatus: status,
      changedBy,
      reason,
    });

    return updatedUser;
  }

  /**
   * ユーザーのロールを変更
   */
  async changeUserRoles(
    id: string,
    roles: UserRole[],
    changedBy: string
  ): Promise<UserProfile> {
    // 単一のroleシステムの場合、配列の最後の要素を使用（上位のロールを優先）
    const newRole = roles[roles.length - 1];
    if (!newRole) {
      throw new AppError('ロールを指定してください', 400, 'ROLE_REQUIRED');
    }
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }

    // 権限チェック
    const currentUser = await this.userRepository.findById(changedBy);
    if (!currentUser) {
      throw new AppError('権限がありません', 403, 'FORBIDDEN');
    }

    // SuperAdminロールの付与はSuperAdminのみ
    if (newRole === UserRole.SUPER_ADMIN && 
        currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new AppError('SuperAdminロールを付与する権限がありません', 403, 'FORBIDDEN');
    }

    // Ownerロールの変更制限（SuperAdminも含めて適用）
    if (user.role === UserRole.OWNER && newRole !== UserRole.OWNER) {
      // 組織に他のOwnerがいるか確認
      if (!user.organizationId) {
        throw new AppError('組織に所属していないユーザーです', 400, 'NO_ORGANIZATION');
      }
      const orgUsers = await this.userRepository.findAll({
        pagination: { page: 1, limit: 100 },
        filters: { 
          organizationId: user.organizationId,
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE
        }
      });
      
      if (orgUsers.users.length <= 1) {
        throw new AppError('組織には最低1人のOwnerが必要です', 400, 'LAST_OWNER');
      }
    }

    // 単一のroleフィールドを更新
    // UserModelを直接使用してロールを更新
    const userDoc = await UserModel.findById(id);
    if (!userDoc) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }
    userDoc.role = newRole;
    const savedUser = await userDoc.save();
    const updatedUser = savedUser.toJSON() as UserProfile;

    logger.info('User role changed', {
      userId: id,
      oldRole: user.role,
      newRole: newRole,
      changedBy,
    });

    return updatedUser;
  }


  /**
   * ユーザーを削除（論理削除）
   */
  async deleteUser(id: string, deletedBy: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
    }

    // 権限チェック
    const currentUser = await this.userRepository.findById(deletedBy);
    if (!currentUser || !this.hasManagementRole(currentUser)) {
      throw new AppError('権限がありません', 403, 'FORBIDDEN');
    }

    // 組織境界チェック
    if (currentUser.role !== UserRole.SUPER_ADMIN && 
        currentUser.organizationId !== user.organizationId) {
      throw new AppError('他組織のユーザーは削除できません', 403, 'CROSS_ORG_ACCESS');
    }

    // Ownerの削除制限
    if (user.role === UserRole.OWNER) {
      if (!user.organizationId) {
        throw new AppError('組織に所属していないユーザーです', 400, 'NO_ORGANIZATION');
      }
      const orgUsers = await this.userRepository.findAll({
        pagination: { page: 1, limit: 100 },
        filters: { 
          organizationId: user.organizationId,
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE
        }
      });
      
      if (orgUsers.users.length <= 1) {
        throw new AppError('組織の最後のOwnerは削除できません', 400, 'LAST_OWNER');
      }
    }

    const success = await this.userRepository.delete(id);
    if (!success) {
      throw new AppError('ユーザーの削除に失敗しました', 500, 'DELETE_FAILED');
    }

    logger.info('User deleted', { userId: id, deletedBy });
  }

  /**
   * ユーザーが管理権限を持っているかチェック
   */
  private hasManagementRole(user: UserProfile): boolean {
    return [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(user.role);
  }

  /**
   * スタイリストの離職リスクサマリーを取得
   */
  async getTurnoverRiskSummary(organizationId: string): Promise<{
    high: number;
    medium: number;
    low: number;
    total: number;
  }> {
    logger.info('Calculating turnover risk summary', { organizationId });

    const { users } = await this.userRepository.findAll({
      pagination: { page: 1, limit: 1000 }, // 全スタイリストを取得
      filters: {
        organizationId,
        role: UserRole.USER, // スタイリストはUSERロール
        status: UserStatus.ACTIVE
      }
    });

    const summary = {
      high: 0,
      medium: 0,
      low: 0,
      total: users.length
    };

    // TODO: 実際のリスク分析ロジックを実装
    // 現時点では仮のデータを返す
    users.forEach(() => {
      // 仮のロジック：ランダムにリスクレベルを割り当て
      const random = Math.random();
      if (random < 0.2) {
        summary.high++;
      } else if (random < 0.5) {
        summary.medium++;
      } else {
        summary.low++;
      }
    });

    logger.info('Turnover risk summary calculated', {
      organizationId,
      summary,
      stylistCount: users.length
    });

    return summary;
  }
}