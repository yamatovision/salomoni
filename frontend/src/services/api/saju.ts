import { apiClient } from './apiClient';
import type { 
  ApiResponse,
  FourPillarsData,
  CompatibilityCalculateRequest,
  CompatibilityResult,
  BeautyPersonalizedAdvice
} from '../../types';
import { API_PATHS } from '../../types';

export class SajuService {
  // 四柱推命計算実行
  async calculate(data: {
    birthDate: string;
    birthTime?: string;
    gender?: 'male' | 'female';
    location?: {
      name: string;
      longitude: number;
      latitude: number;
    };
  }): Promise<ApiResponse<FourPillarsData>> {
    const response = await apiClient.post(API_PATHS.SAJU.CALCULATE, data);
    return response.data;
  }

  // 四柱推命マスターデータ取得
  async getMasters(): Promise<ApiResponse<any>> {
    const response = await apiClient.get(API_PATHS.SAJU.MASTERS);
    return response.data;
  }

  // 追加分析実行（美容アドバイス生成など）
  async analyze(data: {
    fourPillarsData: FourPillarsData;
    analysisType: 'beauty' | 'personality' | 'career';
    context?: {
      skinType?: string;
      concerns?: string[];
      preferences?: string[];
    };
  }): Promise<ApiResponse<BeautyPersonalizedAdvice | any>> {
    const response = await apiClient.post(API_PATHS.SAJU.ANALYZE, data);
    return response.data;
  }

  // 相性診断実行
  async checkCompatibility(data: CompatibilityCalculateRequest): Promise<ApiResponse<CompatibilityResult>> {
    const response = await apiClient.post(API_PATHS.SAJU.COMPATIBILITY, data);
    return response.data;
  }

  // ユーザーの四柱推命データ取得（キャッシュ済み）
  async getUserFourPillars(userId: string): Promise<ApiResponse<FourPillarsData>> {
    const response = await apiClient.get(API_PATHS.SAJU.USER(userId));
    return response.data;
  }

  // 日運データ取得
  async getDailyFortune(userId?: string): Promise<ApiResponse<any>> {
    const endpoint = userId ? `/api/fortune/users/${userId}/daily` : '/api/fortune/daily';
    const response = await apiClient.get(endpoint);
    return response.data;
  }

  // 今日の相性スタイリスト取得
  async getTodayCompatibleStylists(clientId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/api/fortune/compatibility/today?clientId=${clientId}`);
    return response.data;
  }

  // 日本の都道府県データ取得
  async getJapanesePrefectures(): Promise<ApiResponse<any>> {
    const response = await apiClient.get(API_PATHS.SAJU.LOCATIONS_JAPAN);
    return response.data;
  }
}