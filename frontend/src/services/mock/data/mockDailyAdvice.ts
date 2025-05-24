import type { 
  DailyAdviceData
} from '../../../types';
import { 
  FortuneCardCategory, 
  FortuneCardIconTheme
} from '../../../types';

export const mockDailyAdviceData: DailyAdviceData = {
  id: 'daily-advice-001',
  userId: 'mock-user-001', // 鈴木 美咲
  date: new Date('2025-05-24'),
  aiCharacterName: 'Ruka',
  aiCharacterAvatar: '💖',
  greetingMessage: '今日も素敵な一日になりそうだね♡',
  cards: [
    {
      id: 'card-001',
      category: FortuneCardCategory.OVERALL_FLOW,
      iconTheme: FortuneCardIconTheme.WEATHER,
      icon: '🌤',
      title: '全体の流れ',
      shortAdvice: '今日は落ち着いた雰囲気が伝わりやすい日',
      detailAdvice: 'お客様に安心感を与える接客が特に効果的です。ゆったりとした話し方と丁寧な説明を心がけると、信頼関係が深まりやすくなります。',
      gradientColors: {
        from: '#60a5fa',
        to: '#3b82f6'
      },
      color: '#60a5fa',
      position: 0,
      isMainCard: true
    },
    {
      id: 'card-002',
      category: FortuneCardCategory.TECHNIQUE_FOCUS,
      iconTheme: FortuneCardIconTheme.SCISSORS,
      icon: '✂️',
      title: '技術・施術の集中度',
      shortAdvice: 'カットラインが冴えやすい日です',
      detailAdvice: '特に11時〜14時の時間帯は集中力が高まります。細かいディテールや左右のバランスも整えやすく、お客様の満足度も高くなりやすいでしょう。',
      gradientColors: {
        from: '#f59e0b',
        to: '#d97706'
      },
      color: '#f59e0b',
      position: 1,
      isMainCard: false
    },
    {
      id: 'card-003',
      category: FortuneCardCategory.CUSTOMER_COMMUNICATION,
      iconTheme: FortuneCardIconTheme.CHAT,
      icon: '💬',
      title: '接客・対人コミュニケーション',
      shortAdvice: '聞き上手になれる日',
      detailAdvice: 'お客様の話をじっくり聞くことで、潜在的なニーズを引き出せます。相槌を打ちながら共感を示すことで、より深い信頼関係を築けるでしょう。',
      gradientColors: {
        from: '#10b981',
        to: '#059669'
      },
      color: '#10b981',
      position: 2,
      isMainCard: false
    },
    {
      id: 'card-004',
      category: FortuneCardCategory.APPOINTMENT_REPEAT,
      iconTheme: FortuneCardIconTheme.TARGET,
      icon: '💡',
      title: '今日の指名・リピーター運',
      shortAdvice: 'リピーターが増えやすい運気',
      detailAdvice: '今日接客したお客様は、高い確率でリピーターになる可能性があります。次回予約の提案をするタイミングを逃さないようにしましょう。',
      gradientColors: {
        from: '#8b5cf6',
        to: '#7c3aed'
      },
      color: '#8b5cf6',
      position: 3,
      isMainCard: false
    },
    {
      id: 'card-005',
      category: FortuneCardCategory.LUCKY_STYLING,
      iconTheme: FortuneCardIconTheme.STYLE,
      icon: '🌈',
      title: 'ラッキースタイリング',
      shortAdvice: 'ナチュラルな質感が◎',
      detailAdvice: '今日は自然な動きを活かしたスタイリングが特におすすめ。エアリーな質感や柔らかいカールが、お客様の魅力を最大限に引き出します。',
      gradientColors: {
        from: '#ec4899',
        to: '#db2777'
      },
      color: '#ec4899',
      position: 4,
      isMainCard: false
    },
    {
      id: 'card-006',
      category: FortuneCardCategory.LUCKY_ITEM,
      iconTheme: FortuneCardIconTheme.SPARKLE,
      icon: '🎯',
      title: 'ラッキーアイテム',
      shortAdvice: 'ピンクゴールドのアクセサリー',
      detailAdvice: 'ピンクゴールドのアイテムを身に着けることで、優しさと華やかさを演出できます。特にイヤリングやネックレスがおすすめです。',
      gradientColors: {
        from: '#f97316',
        to: '#ea580c'
      },
      color: '#f97316',
      position: 5,
      isMainCard: false
    },
    {
      id: 'card-007',
      category: FortuneCardCategory.SELF_CARE,
      iconTheme: FortuneCardIconTheme.HEART,
      icon: '🧖‍♀️',
      title: 'セルフケア・体調アドバイス',
      shortAdvice: '肩と首のストレッチを意識して',
      detailAdvice: '施術の合間に肩を回したり、首をゆっくり動かすことで疲労が蓄積しにくくなります。休憩時間には温かいハーブティーがおすすめです。',
      gradientColors: {
        from: '#06b6d4',
        to: '#0891b2'
      },
      color: '#06b6d4',
      position: 6,
      isMainCard: false
    },
    {
      id: 'card-008',
      category: FortuneCardCategory.COMPATIBILITY_STYLIST,
      iconTheme: FortuneCardIconTheme.PARTNER,
      icon: '💞',
      title: '相性の良いスタイリスト',
      shortAdvice: '',
      detailAdvice: '',
      gradientColors: {
        from: '#F26A8D',
        to: '#e11d48'
      },
      color: '#F26A8D',
      position: 7,
      isMainCard: false
    }
  ],
  compatibleStylist: {
    stylistId: 'mock-user-003',
    stylistName: '佐藤 愛子',
    compatibilityScore: 5,
    reason: '今日のあなたの穏やかなエネルギーと愛子さんの明るさが絶妙にマッチ',
    collaborationAdvice: 'カラーリングの相談をすると、素敵なアイデアが生まれそうです。'
  },
  createdAt: new Date('2025-05-24T00:00:00'),
  expiresAt: new Date('2025-05-24T23:59:59')
};

// 他の日付用のモックデータも追加
export const mockDailyAdviceHistory: DailyAdviceData[] = [
  mockDailyAdviceData,
  // 過去のデータも必要に応じて追加
];