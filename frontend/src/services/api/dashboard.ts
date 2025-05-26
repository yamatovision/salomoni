import { apiClient } from './apiClient';
import type { DashboardSummary } from '../../types';

class DashboardService {
  /**
   * 管理者ダッシュボードのデータを取得
   * @returns ダッシュボードの統計情報
   */
  async getDashboardStats(): Promise<DashboardSummary> {
    const response = await apiClient.get('/api/admin/dashboard');
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();