import type { 
  DailyFortune,
  DailyAdviceData,
  FortuneCard,
  CompatibleStylist,
  StylistFortuneDetail
} from '../../../types';
import { 
  mockDailyFortune,
  mockDailyAdvice,
  mockFortuneCards,
  mockStylistFortuneDetail
} from '../data/mockFortuneData';

export class MockFortuneService {
  async getDailyFortune(_userId: string): Promise<DailyFortune> {
    console.warn('🔧 Using MOCK data for daily fortune');
    return mockDailyFortune;
  }

  async getDailyAdvice(_userId: string): Promise<DailyAdviceData> {
    console.warn('🔧 Using MOCK data for daily advice');
    return mockDailyAdvice;
  }

  async getFortuneCards(_userId: string): Promise<FortuneCard[]> {
    console.warn('🔧 Using MOCK data for fortune cards');
    return mockFortuneCards;
  }

  async getCompatibleStylists(_userId: string): Promise<CompatibleStylist[]> {
    console.warn('🔧 Using MOCK data for compatible stylists');
    // モックデータを返す
    return mockDailyAdvice.compatibleStylist ? [mockDailyAdvice.compatibleStylist] : [];
  }

  async getStylistFortuneDetail(_userId: string): Promise<StylistFortuneDetail> {
    console.warn('🔧 Using MOCK data for stylist fortune detail');
    return mockStylistFortuneDetail;
  }

  async regenerateAdvice(_userId: string): Promise<DailyAdviceData> {
    console.warn('🔧 Using MOCK data for regenerate advice');
    // 再生成のシミュレーション
    return {
      ...mockDailyAdvice,
      greetingMessage: '新しく生成されたアドバイス: 今日は特に人との繋がりを大切にする日です。お客様との会話を楽しみ、相手の話に耳を傾けることで、思わぬ発見があるでしょう。',
      createdAt: new Date()
    };
  }
}