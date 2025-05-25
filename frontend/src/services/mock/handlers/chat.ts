import { mockConversations } from '../data/mockConversations';
import { mockChatMessages } from '../data/mockChatMessages';
import { mockAICharacters } from '../data/mockAICharacters';
import type {
  ApiResponse,
  Conversation,
  ConversationCreateRequest,
  ConversationContextType,
  ChatMessage,
  MessageSendRequest,
  PaginationParams,
  ConversationStartResponse,
} from '../../../types';
import { MessageType } from '../../../types';

// モックの遅延時間
const MOCK_DELAY = 500;

export class MockChatService {
  private async delay() {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  }

  // 新規会話セッション作成
  async createConversation(data: ConversationCreateRequest): Promise<ApiResponse<Conversation>> {
    await this.delay();
    
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      aiCharacterId: data.aiCharacterId,
      userId: 'user-001', // モックユーザーID
      clientId: data.clientId,
      context: data.context,
      status: 'active',
      startedAt: new Date(),
      messageCount: 0,
    };
    
    return {
      success: true,
      data: newConversation,
    };
  }

  // 会話セッション一覧取得
  async getConversations(params?: {
    context?: ConversationContextType;
    clientId?: string;
    active?: boolean;
  } & PaginationParams): Promise<ApiResponse<Conversation[]>> {
    await this.delay();
    
    let conversations = [...mockConversations];
    
    // フィルタリング
    if (params?.context) {
      conversations = conversations.filter(c => c.context === params.context);
    }
    if (params?.clientId) {
      conversations = conversations.filter(c => c.clientId === params.clientId);
    }
    if (params?.active !== undefined) {
      conversations = conversations.filter(c => (c.status === 'active') === params.active);
    }
    
    // ページネーション
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const paginatedConversations = conversations.slice(start, start + limit);
    
    return {
      success: true,
      data: paginatedConversations,
      meta: {
        total: conversations.length,
        page,
        limit,
        totalPages: Math.ceil(conversations.length / limit),
      },
    };
  }

  // メッセージ送信
  async sendMessage(
    conversationId: string,
    _data: MessageSendRequest
  ): Promise<ApiResponse<ChatMessage>> {
    await this.delay();
    
    // ユーザーメッセージを作成（実際のシステムではDBに保存される）
    
    // AI応答をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const aiResponses = [
      'なるほど！それは興味深いね。もっと詳しく教えて？',
      'その気持ち、よくわかるよ。どんな風に感じてる？',
      '素敵！それってどんな感じ？',
      'そうなんだ！私も同じように思うことがあるよ。',
    ];
    
    const aiMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      conversationId,
      type: MessageType.AI,
      content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
      createdAt: new Date(),
    };
    
    return {
      success: true,
      data: aiMessage,
    };
  }

  // 会話履歴取得
  async getMessages(
    conversationId: string,
    params?: {
      order?: 'asc' | 'desc';
    } & PaginationParams
  ): Promise<ApiResponse<ChatMessage[]>> {
    await this.delay();
    
    let messages = mockChatMessages.filter(m => m.conversationId === conversationId);
    
    // ソート
    if (params?.order === 'desc') {
      messages = messages.reverse();
    }
    
    // ページネーション
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const start = (page - 1) * limit;
    const paginatedMessages = messages.slice(start, start + limit);
    
    return {
      success: true,
      data: paginatedMessages,
      meta: {
        total: messages.length,
        page,
        limit,
        totalPages: Math.ceil(messages.length / limit),
      },
    };
  }

  // 会話終了
  async endConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    await this.delay();
    
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (!conversation) {
      return {
        success: false,
        error: '会話が見つかりません',
      };
    }
    
    conversation.status = 'ended';
    conversation.endedAt = new Date();
    
    return {
      success: true,
      data: conversation,
    };
  }

  // チャット自動開始
  async startChat(data: {
    context: ConversationContextType;
    clientId?: string;
  }): Promise<ApiResponse<ConversationStartResponse>> {
    await this.delay();
    
    // アクティブな会話を探す
    const activeConversation = mockConversations.find(
      c => c.status === 'active' && c.context === data.context && c.clientId === data.clientId
    );
    
    if (activeConversation) {
      return {
        success: true,
        data: {
          conversation: activeConversation,
          aiCharacter: mockAICharacters[0],
          isNew: false,
        },
      };
    }
    
    // 新規会話を作成
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      aiCharacterId: mockAICharacters[0].id,
      userId: 'user-001',
      clientId: data.clientId,
      context: data.context,
      status: 'active',
      startedAt: new Date(),
      messageCount: 0,
    };
    
    return {
      success: true,
      data: {
        conversation: newConversation,
        aiCharacter: mockAICharacters[0],
        isNew: true,
      },
    };
  }
}