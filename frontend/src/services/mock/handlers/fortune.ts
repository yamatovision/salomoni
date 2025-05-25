import type { 
  DailyFortune,
  DailyAdviceData,
  FortuneCard,
  CompatibleStylist,
  StylistFortuneDetail,
  FortuneCardCategory
} from '../../../types';
import { 
  mockDailyFortune,
  mockDailyAdvice,
  mockFortuneCards,
  mockCompatibleStylists,
  mockStylistFortuneDetail
} from '../data/mockFortuneData';

export class MockFortuneService {
  async getDailyFortune(userId: string): Promise<DailyFortune> {
    console.warn('🔧 Using MOCK data for daily fortune');
    return mockDailyFortune;
  }

  async getDailyAdvice(userId: string): Promise<DailyAdviceData> {
    console.warn('🔧 Using MOCK data for daily advice');
    return mockDailyAdvice;
  }

  async getFortuneCards(userId: string): Promise<FortuneCard[]> {
    console.warn('🔧 Using MOCK data for fortune cards');
    return mockFortuneCards;
  }

  async getCompatibleStylists(userId: string): Promise<CompatibleStylist[]> {
    console.warn('🔧 Using MOCK data for compatible stylists');
    return mockCompatibleStylists;
  }

  async getStylistFortuneDetail(userId: string): Promise<StylistFortuneDetail> {
    console.warn('🔧 Using MOCK data for stylist fortune detail');
    return mockStylistFortuneDetail;
  }

  async regenerateAdvice(userId: string): Promise<DailyAdviceData> {
    console.warn('🔧 Using MOCK data for regenerate advice');
    // 再生成のシミュレーション
    return {
      ...mockDailyAdvice,
      advice: '新しく生成されたアドバイス: 今日は特に人との繋がりを大切にする日です。お客様との会話を楽しみ、相手の話に耳を傾けることで、思わぬ発見があるでしょう。',
      regeneratedAt: new Date()
    };
  }
}