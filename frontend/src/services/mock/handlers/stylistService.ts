import type { 
  StylistDetail,
  StylistSearchFilter,
  TurnoverRiskAnalysis,
  StylistReport,
  ApiResponse
} from '../../../types';
import {
  getStylistsHandler,
  getStylistByIdHandler,
  getTurnoverRiskAnalysisHandler,
  getStylistReportHandler,
  createStylistHandler,
  updateStylistHandler,
  deleteStylistHandler,
  getStylistFourPillarsHandler,
  getTurnoverRiskSummaryHandler
} from './stylists';

export class MockStylistService {
  async getStylists(filter?: StylistSearchFilter): Promise<ApiResponse<StylistDetail[]>> {
    // 実際のAPIを模倣するため、少し遅延を入れる
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStylistsHandler(filter);
  }

  async getStylistById(stylistId: string): Promise<ApiResponse<StylistDetail>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const response = getStylistByIdHandler(stylistId);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'スタイリストが見つかりません');
    }
    return response as ApiResponse<StylistDetail>;
  }

  async getTurnoverRiskAnalysis(stylistId: string): Promise<ApiResponse<TurnoverRiskAnalysis>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const response = getTurnoverRiskAnalysisHandler(stylistId);
    if (!response.success || !response.data) {
      throw new Error(response.error || '離職リスク分析データが見つかりません');
    }
    return response as ApiResponse<TurnoverRiskAnalysis>;
  }

  async getStylistReport(stylistId: string): Promise<ApiResponse<StylistReport>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const response = getStylistReportHandler(stylistId);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'レポートデータが見つかりません');
    }
    return response as ApiResponse<StylistReport>;
  }

  async createStylist(data: Partial<StylistDetail>): Promise<ApiResponse<StylistDetail>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return createStylistHandler(data);
  }

  async updateStylist(stylistId: string, data: Partial<StylistDetail>): Promise<ApiResponse<StylistDetail>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return updateStylistHandler(stylistId, data);
  }

  async deleteStylist(stylistId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return deleteStylistHandler(stylistId);
  }

  async getStylistFourPillars(stylistId: string): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStylistFourPillarsHandler(stylistId);
  }

  async getTurnoverRiskSummary(): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return getTurnoverRiskSummaryHandler();
  }
}