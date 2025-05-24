import type { 
  DailyFortune, 
  StylistFortuneDetail,
  FourPillarsData,
  ElementBalance
} from '../../../types';
import { 
  FiveElements,
  YinYang
} from '../../../types';

// スタイリスト向け日運データ
export const mockDailyFortune: DailyFortune = {
  id: 'fortune-001',
  userId: 'mock-user-001', // 鈴木 美咲
  date: new Date('2025-05-24'),
  overallLuck: 4,
  workLuck: 5,
  relationshipLuck: 4,
  healthLuck: 3,
  luckyColor: 'ピンクゴールド',
  luckyDirection: '南東',
  advice: '今日は人との調和を大切にすることで、素晴らしい成果が期待できます。',
  warnings: ['午後3時頃は少し疲れやすいので、適度な休憩を心がけましょう。']
};

// スタイリスト向け詳細運勢
export const mockStylistFortuneDetail: StylistFortuneDetail = {
  ...mockDailyFortune,
  stylistId: 'mock-user-001',
  creativityLuck: 5,
  precisionLuck: 4,
  communicationLuck: 5,
  salesLuck: 4,
  
  hourlyFortune: {
    morning: 4,
    afternoon: 5,
    evening: 3,
  },
  
  technicalAdvice: '特にカットの精度が高まる日。左右のバランスを丁寧に確認することで、完成度の高い仕上がりに。',
  customerServiceAdvice: 'お客様の話をじっくり聞くことで、潜在的なニーズを引き出せます。',
  businessAdvice: '次回予約の提案をするのに最適な日。特に3ヶ月先までの予約を提案してみましょう。',
  
  luckyTechnique: 'レイヤーカット',
  luckyProduct: 'トリートメントオイル',
  luckyTimeSlot: '11:00-14:00',
  
  fortuneCards: [],
  compatibleColleagues: [],
  todaysKeyPoints: ['今日のポイント1', '今日のポイント2']
};

// 四柱推命データ（鈴木 美咲）
export const mockFourPillarsData: FourPillarsData = {
  id: 'fourpillars-001',
  userId: 'mock-user-001',
  yearPillar: {
    stem: '甲',
    branch: '子',
    element: FiveElements.WOOD,
    yinYang: YinYang.YANG,
  },
  monthPillar: {
    stem: '丙',
    branch: '寅',
    element: FiveElements.FIRE,
    yinYang: YinYang.YANG,
  },
  dayPillar: {
    stem: '戊',
    branch: '辰',
    element: FiveElements.EARTH,
    yinYang: YinYang.YANG,
  },
  hourPillar: {
    stem: '庚',
    branch: '申',
    element: FiveElements.METAL,
    yinYang: YinYang.YANG,
  },
  calculatedAt: new Date('2025-01-15'),
};

// 五行バランス
export const mockElementBalance: ElementBalance = {
  wood: 20,
  fire: 25,
  earth: 30,
  metal: 15,
  water: 10,
  mainElement: FiveElements.EARTH,
  isBalanced: false,
};

// 他のスタイリストの運勢データ
export const mockOtherStylists: Array<{userId: string; name: string; fortune: DailyFortune}> = [
  {
    userId: 'mock-user-003',
    name: '佐藤 愛子',
    fortune: {
      id: 'fortune-003',
      userId: 'mock-user-003',
      date: new Date('2025-05-24'),
      overallLuck: 5,
      workLuck: 4,
      relationshipLuck: 5,
      healthLuck: 4,
      luckyColor: 'コーラルピンク',
      luckyDirection: '南',
      advice: '明るいエネルギーが周囲を照らす日'
    }
  }
];