import { apiClient } from './apiClient';
import type { 
  ApiResponse,
  StylistDetail,
  StylistSearchFilter,
  TurnoverRiskAnalysis,
  StylistReport,
  StaffInviteRequest
} from '../../types';
import { API_PATHS } from '../../types';

export class StylistService {
  // スタイリスト一覧取得
  async getStylists(filter?: StylistSearchFilter): Promise<ApiResponse<StylistDetail[]>> {
    const params = new URLSearchParams();
    if (filter?.searchTerm) params.append('search', filter.searchTerm);
    if (filter?.role) params.append('role', filter.role);
    if (filter?.riskLevel) params.append('riskLevel', filter.riskLevel);
    if (filter?.isActive !== undefined) params.append('isActive', String(filter.isActive));

    const response = await apiClient.get(`${API_PATHS.USERS.LIST}?${params.toString()}`);
    return response.data;
  }

  // スタイリスト詳細取得
  async getStylistById(stylistId: string): Promise<ApiResponse<StylistDetail>> {
    const response = await apiClient.get(API_PATHS.USERS.DETAIL(stylistId));
    return response.data;
  }

  // 離職リスク分析取得
  async getTurnoverRiskAnalysis(stylistId: string): Promise<ApiResponse<TurnoverRiskAnalysis>> {
    const response = await apiClient.get(`${API_PATHS.ADMIN.STYLISTS}/${stylistId}/risk-analysis`);
    return response.data;
  }

  // スタイリストレポート取得
  async getStylistReport(stylistId: string, startDate?: string, endDate?: string): Promise<ApiResponse<StylistReport>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = `/api/admin/stylists/${stylistId}/report${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data;
  }

  // スタイリスト新規作成（招待）
  async createStylist(data: StaffInviteRequest): Promise<ApiResponse<StylistDetail>> {
    const response = await apiClient.post(API_PATHS.USERS.INVITE, data);
    return response.data;
  }

  // スタイリスト更新
  async updateStylist(stylistId: string, data: Partial<StylistDetail>): Promise<ApiResponse<StylistDetail>> {
    const response = await apiClient.put(API_PATHS.USERS.UPDATE(stylistId), data);
    return response.data;
  }

  // スタイリスト削除
  async deleteStylist(stylistId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(API_PATHS.USERS.DELETE(stylistId));
    return response.data;
  }

  // 四柱推命プロフィール取得
  async getStylistFourPillars(stylistId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(API_PATHS.SAJU.USER(stylistId));
    return response.data;
  }

  // 離職リスクサマリー取得
  async getTurnoverRiskSummary(): Promise<ApiResponse<any>> {
    const response = await apiClient.get(API_PATHS.ADMIN.STYLISTS_RISK_SUMMARY);
    return response.data;
  }
}