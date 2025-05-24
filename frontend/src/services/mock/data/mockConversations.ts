import type { 
  Conversation,
  ChatMessage,
  AIMemory
} from '../../../types';
import {
  MessageType,
  AIMemoryType
} from '../../../types';

// 会話セッション
export const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    userId: 'mock-user-001', // 鈴木 美咲
    aiCharacterId: 'ai-char-001', // Ruka
    context: 'personal',
    startedAt: new Date('2025-05-24T09:00:00'),
    endedAt: undefined,
    messageCount: 5,
    memoryUpdates: ['mem-001', 'mem-002']
  },
  {
    id: 'conv-002',
    userId: 'mock-user-001',
    aiCharacterId: 'ai-char-001',
    context: 'stylist_consultation',
    startedAt: new Date('2025-05-23T14:30:00'),
    endedAt: new Date('2025-05-23T15:00:00'),
    messageCount: 12,
  }
];

// チャットメッセージ
export const mockChatMessages: ChatMessage[] = [
  // 今日の会話（conv-001）
  {
    id: 'msg-001',
    conversationId: 'conv-001',
    type: MessageType.AI,
    content: 'おはよう、美咲ちゃん！今日も素敵な一日になりそうだね♡ 運勢をチェックしたら、今日は特に技術面の集中力が高まる日みたい。',
    metadata: {
      emotions: ['cheerful', 'caring']
    },
    createdAt: new Date('2025-05-24T09:00:00')
  },
  {
    id: 'msg-002',
    conversationId: 'conv-001',
    type: MessageType.USER,
    content: 'おはよう！今日は朝から予約がいっぱいで、ちょっと不安かも...',
    createdAt: new Date('2025-05-24T09:01:00')
  },
  {
    id: 'msg-003',
    conversationId: 'conv-001',
    type: MessageType.AI,
    content: '大丈夫！美咲ちゃんならきっと素敵な施術ができるよ✨\n\n今日の運勢を見てみる？特に11時〜14時の時間帯は集中力が高まるから、難しいカットもバッチリ決まりそう！',
    metadata: {
      emotions: ['supportive', 'encouraging'],
      suggestedActions: ['今日の運勢を見る', '相性の良いスタイリストを確認']
    },
    createdAt: new Date('2025-05-24T09:02:00')
  },
  {
    id: 'msg-004',
    conversationId: 'conv-001',
    type: MessageType.USER,
    content: '今日の運勢を見せて！',
    createdAt: new Date('2025-05-24T09:03:00')
  },
  {
    id: 'msg-005',
    conversationId: 'conv-001',
    type: MessageType.AI,
    content: '今日の運勢をチェックしたよ！',
    metadata: {
      richContent: {
        fortuneCard: {
          type: 'daily_fortune',
          title: '今日の運勢',
          icon: '✨',
          items: [
            { label: '全体運', value: '★★★★☆', color: '#F26A8D' },
            { label: '仕事運', value: '★★★★★', color: '#f59e0b' },
            { label: '対人運', value: '★★★★☆', color: '#10b981' },
            { label: '健康運', value: '★★★☆☆', color: '#06b6d4' }
          ]
        },
        quickActions: [
          { id: 'detail', label: '詳細を見る', icon: '📊', action: 'navigate:/dashboard', style: 'primary' },
          { id: 'compatible', label: '相性の良いスタイリスト', icon: '💞', action: 'show:compatible', style: 'secondary' }
        ]
      }
    },
    createdAt: new Date('2025-05-24T09:04:00')
  },
  
  // 昨日の会話（conv-002）
  {
    id: 'msg-101',
    conversationId: 'conv-002',
    type: MessageType.USER,
    content: '今度来るお客様、すごく髪が痛んでるみたいなんだけど、どんなトリートメントがおすすめかな？',
    createdAt: new Date('2025-05-23T14:30:00')
  },
  {
    id: 'msg-102',
    conversationId: 'conv-002',
    type: MessageType.AI,
    content: '髪のダメージが気になるお客様なんだね。まず、ダメージの原因を聞いてみるのが大切だよ！\n\n例えば：\n・カラーやパーマの頻度\n・普段のヘアケア方法\n・ドライヤーやアイロンの使用頻度\n\nこれらを確認してから、最適なトリートメントを提案できるよ♪',
    createdAt: new Date('2025-05-23T14:31:00')
  }
];

// AIメモリデータ
export const mockAIMemories: AIMemory[] = [
  {
    id: 'mem-001',
    characterId: 'ai-char-001',
    memoryType: AIMemoryType.EXPLICIT,
    content: '美咲ちゃんは朝の予約が多い日は少し不安になることがある',
    category: '感情パターン',
    isActive: true,
    createdAt: new Date('2025-05-24T09:02:00'),
    updatedAt: new Date('2025-05-24T09:02:00')
  },
  {
    id: 'mem-002',
    characterId: 'ai-char-001',
    memoryType: AIMemoryType.AUTO,
    content: '運勢チェックが励みになっている様子',
    category: 'モチベーション',
    extractedFrom: 'msg-004',
    confidence: 85,
    isActive: true,
    createdAt: new Date('2025-05-24T09:04:00'),
    updatedAt: new Date('2025-05-24T09:04:00')
  },
  {
    id: 'mem-003',
    characterId: 'ai-char-001',
    memoryType: AIMemoryType.EXPLICIT,
    content: '技術的な相談をよくしてくれる。特にトリートメントについて関心が高い',
    category: '専門スキル',
    isActive: true,
    createdAt: new Date('2025-05-23T14:35:00'),
    updatedAt: new Date('2025-05-23T14:35:00')
  }
];