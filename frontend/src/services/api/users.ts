import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { UserProfile, ApiResponse, PaginationParams, PaginationInfo, UserRole, UserStatus } from '../../types';

export class UserService {
  async getUsers(params?: PaginationParams & {
    organizationId?: string;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }): Promise<{
    users: UserProfile[];
    pagination: PaginationInfo;
  }> {
    const response = await apiClient.get<ApiResponse<{
      data: UserProfile[];
      pagination: PaginationInfo;
    }>>(API_PATHS.USERS.LIST, { params });
    
    // APIレスポンスの形式に応じて処理
    if (response.data.data && 'data' in response.data.data) {
      // ページネーション付きレスポンスの場合
      return {
        users: (response.data.data as any).data,
        pagination: (response.data.data as any).pagination
      };
    } else if (Array.isArray(response.data.data)) {
      // 配列直接返却の場合（後方互換性）
      return {
        users: response.data.data as UserProfile[],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: (response.data.data as UserProfile[]).length,
          itemsPerPage: (response.data.data as UserProfile[]).length,
          hasNext: false,
          hasPrev: false
        }
      };
    }
    
    return {
      users: response.data.data!.data,
      pagination: response.data.data!.pagination
    };
  }

  async getUser(id: string): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(API_PATHS.USERS.DETAIL(id));
    return response.data;
  }

  async updateUser(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>(API_PATHS.USERS.UPDATE(id), data);
    return response.data;
  }

  // 強制ログアウト
  async forceLogout(userId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post(API_PATHS.USERS.FORCE_LOGOUT(userId));
    return response.data;
  }

  // トークン使用量取得
  async getTokenUsage(userId: string): Promise<ApiResponse<{ 
    totalUsage: number; 
    remainingTokens: number; 
    history: Array<{
      date: Date;
      usage: number;
      action: string;
    }> 
  }>> {
    const response = await apiClient.get(API_PATHS.USERS.TOKEN_USAGE(userId));
    return response.data;
  }

  // 招待受諾・初回登録完了
  async completeRegistration(data: {
    token: string;
    password: string;
    name?: string;
    birthDate?: string;
  }): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.post('/api/auth/complete-registration', data);
    return response.data;
  }
}