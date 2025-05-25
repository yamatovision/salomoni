import type { ChatMessage, MessageType } from '../../../types';

// モックチャットメッセージデータ
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    type: 'user' as MessageType,
    content: 'こんにちは！今日の調子はどう？',
    createdAt: new Date('2024-05-25T10:00:00'),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    type: 'ai' as MessageType,
    content: 'こんにちは！今日も元気いっぱいだよ♪ あなたはどう？何か楽しいことあった？',
    createdAt: new Date('2024-05-25T10:00:05'),
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    type: 'user' as MessageType,
    content: '今日は新しいお客様が来る予定なんだ',
    createdAt: new Date('2024-05-25T10:01:00'),
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    type: 'ai' as MessageType,
    content: 'わぁ、新しいお客様なんだね！きっと素敵な出会いになるよ✨ 緊張してる？',
    createdAt: new Date('2024-05-25T10:01:10'),
  },
  {
    id: 'msg-5',
    conversationId: 'conv-1',
    type: 'user' as MessageType,
    content: 'ちょっと緊張してるかも',
    createdAt: new Date('2024-05-25T10:02:00'),
  },
  {
    id: 'msg-6',
    conversationId: 'conv-2',
    type: 'user' as MessageType,
    content: '髪型について相談したいです',
    createdAt: new Date('2024-05-25T11:00:00'),
  },
  {
    id: 'msg-7',
    conversationId: 'conv-2',
    type: 'ai' as MessageType,
    content: 'もちろん！どんな髪型を考えてるの？今の気分とか、なりたいイメージがあれば教えて😊',
    createdAt: new Date('2024-05-25T11:00:10'),
  },
  {
    id: 'msg-8',
    conversationId: 'conv-2',
    type: 'user' as MessageType,
    content: '夏に向けてさっぱりしたい',
    createdAt: new Date('2024-05-25T11:01:00'),
  },
];