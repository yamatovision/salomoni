import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { 
  DailyFortune,
  DailyAdviceData,
  FortuneCard,
  CompatibleStylist,
  StylistFortuneDetail
} from '../../types';

export class FortuneService {
  async getDailyFortune(userId: string): Promise<DailyFortune> {
    const response = await apiClient.get<{ success: boolean; data: DailyFortune }>(
      API_PATHS.FORTUNE.DAILY,
      { params: { userId } }
    );
    return response.data.data;
  }

  async getDailyAdvice(userId: string): Promise<DailyAdviceData> {
    const response = await apiClient.get<{ success: boolean; data: DailyAdviceData }>(
      API_PATHS.FORTUNE.DAILY_ADVICE(userId)
    );
    return response.data.data;
  }

  async getFortuneCards(userId: string): Promise<FortuneCard[]> {
    const response = await apiClient.get<{ success: boolean; data: FortuneCard[] }>(
      API_PATHS.FORTUNE.FORTUNE_CARDS,
      { params: { userId } }
    );
    return response.data.data;
  }

  async getCompatibleStylists(userId: string): Promise<CompatibleStylist[]> {
    const response = await apiClient.get<{ success: boolean; data: CompatibleStylist[] }>(
      API_PATHS.FORTUNE.COMPATIBILITY_TODAY,
      { params: { userId } }
    );
    return response.data.data;
  }

  async getStylistFortuneDetail(userId: string): Promise<StylistFortuneDetail> {
    const response = await apiClient.get<{ success: boolean; data: StylistFortuneDetail }>(
      API_PATHS.FORTUNE.STYLIST_FORTUNE(userId)
    );
    return response.data.data;
  }

  async regenerateAdvice(userId: string): Promise<DailyAdviceData> {
    const response = await apiClient.post<{ success: boolean; data: DailyAdviceData }>(
      API_PATHS.FORTUNE.REGENERATE_ADVICE(userId)
    );
    return response.data.data;
  }
}