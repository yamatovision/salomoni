import type { 
  DailyFortune, 
  StylistFortuneDetail,
  FourPillarsData,
  ElementBalance,
  FortuneCard,
  DailyAdviceData
} from '../../../types';
import { 
  FiveElements,
  FortuneCardCategory,
  FortuneCardIconTheme
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

// 四柱推命データ（鈴木 美咲）
export const mockFourPillarsData: FourPillarsData = {
  _id: 'fourpillars-001',
  userId: 'mock-user-001',
  birthDate: '1991-03-15',
  birthTime: '10:30',
  timezone: 'Asia/Tokyo',
  elementBalance: mockElementBalance,
  tenGods: {
    year: '比肩',
    month: '食神',
    day: '正官',
    hour: '偏財'
  },
  yearPillar: {
    heavenlyStem: '甲',
    earthlyBranch: '子',
    element: '木',
    yinYang: '陽',
  },
  monthPillar: {
    heavenlyStem: '丙',
    earthlyBranch: '寅',
    element: '火',
    yinYang: '陽',
  },
  dayPillar: {
    heavenlyStem: '戊',
    earthlyBranch: '辰',
    element: '土',
    yinYang: '陽',
  },
  hourPillar: {
    heavenlyStem: '庚',
    earthlyBranch: '申',
    element: '金',
    yinYang: '陽',
  },
  calculatedAt: new Date('2025-01-15'),
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

// フォーチュンカード
export const mockFortuneCards: FortuneCard[] = [
  {
    id: 'card-001',
    category: FortuneCardCategory.OVERALL_FLOW,
    iconTheme: FortuneCardIconTheme.SPARKLE,
    icon: '🔑',
    title: '成功の鍵',
    shortAdvice: '今日のあなたの努力は必ず実を結びます',
    detailAdvice: '目標達成に向けて大きく前進する時期です。プロジェクトが成功に向かい、信頼関係が深まります。体調が安定し、活力が増します。自信を持って前進しましょう。',
    gradientColors: {
      from: '#FFD700',
      to: '#FF6B6B'
    },
    position: 0
  },
  {
    id: 'card-002',
    category: FortuneCardCategory.CUSTOMER_COMMUNICATION,
    iconTheme: FortuneCardIconTheme.CHAT,
    icon: '✨',
    title: '調和の光',
    shortAdvice: '人間関係に恵まれる一日',
    detailAdvice: '周囲との調和が取れ、物事がスムーズに進みます。チームワークが向上し、相手を理解し、理解される関係になります。心身のバランスが整います。感謝の気持ちを忘れずに。',
    gradientColors: {
      from: '#667EEA',
      to: '#764BA2'
    },
    position: 1
  }
];

// デイリーアドバイス
export const mockDailyAdvice: DailyAdviceData = {
  id: 'advice-001',
  userId: 'mock-user-001',
  date: new Date('2025-05-24'),
  aiCharacterName: 'ラッキー',
  aiCharacterAvatar: '/images/ai-characters/lucky.png',
  greetingMessage: '今日も素敵な一日になりそうだね♡',
  cards: mockFortuneCards,
  compatibleStylist: {
    stylistId: 'mock-user-003',
    stylistName: '佐藤 愛子',
    compatibilityScore: 5,
    reason: '同じタイプのクリエイティビティを持っているため',
    collaborationAdvice: '今日は特に意気投合しそう！一緒にランチに行ってみては？'
  },
  createdAt: new Date('2025-05-24T00:00:00Z'),
  expiresAt: new Date('2025-05-24T23:59:59Z')
};