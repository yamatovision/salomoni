import type { AICharacter } from '../../../types';
import { AICharacterStyle } from '../../../types';

export const mockAICharacters: AICharacter[] = [
  {
    id: 'ai-char-001',
    userId: 'mock-user-001', // 鈴木 美咲（スタイリスト）
    name: 'Ruka',
    styleFlags: [AICharacterStyle.CHEERFUL, AICharacterStyle.CARING],
    personalityScore: {
      softness: 75,      // やさしさ度
      energy: 85,        // エネルギー度
      formality: 30,     // フォーマル度
    },
    createdAt: new Date('2025-01-15'),
    lastInteractionAt: new Date('2025-05-24'),
  },
  {
    id: 'ai-char-002',
    userId: 'mock-owner-001', // オーナー
    name: 'Sakura',
    styleFlags: [AICharacterStyle.SOFT, AICharacterStyle.ONEESAN],
    personalityScore: {
      softness: 90,
      energy: 60,
      formality: 50,
    },
    createdAt: new Date('2025-01-10'),
    lastInteractionAt: new Date('2025-05-23'),
  },
  {
    id: 'ai-char-003',
    userId: 'mock-admin-001', // 管理者
    name: 'Yui',
    styleFlags: [AICharacterStyle.COOL, AICharacterStyle.MYSTERIOUS],
    personalityScore: {
      softness: 40,
      energy: 50,
      formality: 70,
    },
    createdAt: new Date('2025-01-20'),
    lastInteractionAt: new Date('2025-05-22'),
  },
];