import type { Conversation } from '../../../types';

// âÃ¯qÇü¿
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    userId: 'user-1',
    aiCharacterId: 'ai-char-1',
    context: 'personal',
    status: 'active',
    startedAt: new Date('2024-05-25T10:00:00'),
    messageCount: 5,
  },
  {
    id: 'conv-2',
    userId: 'user-1',
    clientId: 'client-1',
    aiCharacterId: 'ai-char-1',
    context: 'client_direct',
    status: 'active',
    startedAt: new Date('2024-05-25T11:00:00'),
    messageCount: 3,
  },
];