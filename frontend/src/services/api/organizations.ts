import { apiClient } from './apiClient';
import type { 
  ApiResponse,
  Organization,
  OrganizationUpdateRequest,
  OrganizationPlan,
  OrganizationStatus
} from '../../types';
import { API_PATHS } from '../../types';

export class OrganizationService {
  // 組織一覧取得
  async getOrganizations(params?: {
    status?: OrganizationStatus;
    plan?: OrganizationPlan;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Organization[]>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.plan) queryParams.append('plan', params.plan);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const response = await apiClient.get(`${API_PATHS.ORGANIZATIONS.LIST}?${queryParams.toString()}`);
    return response.data;
  }

  // 組織詳細取得
  async getOrganizationById(organizationId: string): Promise<ApiResponse<Organization>> {
    const response = await apiClient.get(API_PATHS.ORGANIZATIONS.DETAIL(organizationId));
    return response.data;
  }

  // 組織とオーナー同時作成（SuperAdmin用）
  async createOrganizationWithOwner(data: {
    name: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    phone?: string;
    address?: string;
    plan: OrganizationPlan;
    status?: OrganizationStatus;
    tokenLimit?: number;
  }): Promise<ApiResponse<{ organization: Organization; owner: any }>> {
    const response = await apiClient.post('/api/organizations/create-with-owner', data);
    return response.data;
  }

  // 組織更新
  async updateOrganization(organizationId: string, data: OrganizationUpdateRequest): Promise<ApiResponse<Organization>> {
    const response = await apiClient.put(API_PATHS.ORGANIZATIONS.UPDATE(organizationId), data);
    return response.data;
  }

  // 組織統計情報取得
  async getOrganizationStats(organizationId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(API_PATHS.ORGANIZATIONS.STATS(organizationId));
    return response.data;
  }

  // 組織ステータス変更
  async updateOrganizationStatus(organizationId: string, status: OrganizationStatus): Promise<ApiResponse<Organization>> {
    const response = await apiClient.patch(API_PATHS.ORGANIZATIONS.STATUS(organizationId), { status });
    return response.data;
  }

  // 組織プラン変更
  async updateOrganizationPlan(organizationId: string, plan: OrganizationPlan): Promise<ApiResponse<Organization>> {
    const response = await apiClient.patch(API_PATHS.ORGANIZATIONS.PLAN(organizationId), { plan });
    return response.data;
  }

  // 組織削除
  async deleteOrganization(organizationId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(API_PATHS.ORGANIZATIONS.DELETE(organizationId));
    return response.data;
  }

  // 組織のユーザー一覧取得
  async getOrganizationUsers(organizationId: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`${API_PATHS.ORGANIZATIONS.DETAIL(organizationId)}/users`);
    return response.data;
  }

  // 組織の請求情報取得
  async getOrganizationBilling(organizationId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`${API_PATHS.ORGANIZATIONS.DETAIL(organizationId)}/billing`);
    return response.data;
  }
}