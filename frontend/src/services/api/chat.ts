import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type {
  ApiResponse,
  Conversation,
  ConversationCreateRequest,
  ChatMessage,
  MessageSendRequest,
  PaginationParams,
  ConversationStartResponse,
} from '../../types';

export class ChatService {
  // 新規会話セッション作成
  async createConversation(data: ConversationCreateRequest): Promise<ApiResponse<Conversation>> {
    try {
      const response = await apiClient.post<ApiResponse<Conversation>>(
        API_PATHS.CHAT.CONVERSATIONS,
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'チャットの作成に失敗しました',
      };
    }
  }

  // 会話セッション一覧取得
  async getConversations(params?: {
    context?: 'personal' | 'stylist_consultation' | 'client_direct';
    clientId?: string;
    active?: boolean;
  } & PaginationParams): Promise<ApiResponse<Conversation[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Conversation[]>>(
        API_PATHS.CHAT.CONVERSATIONS,
        { params }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || '会話一覧の取得に失敗しました',
      };
    }
  }

  // メッセージ送信
  async sendMessage(
    conversationId: string,
    data: MessageSendRequest
  ): Promise<ApiResponse<ChatMessage>> {
    try {
      const response = await apiClient.post<ApiResponse<ChatMessage>>(
        API_PATHS.CHAT.SEND_MESSAGE(conversationId),
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'メッセージの送信に失敗しました',
      };
    }
  }

  // 会話履歴取得
  async getMessages(
    conversationId: string,
    params?: {
      order?: 'asc' | 'desc';
    } & PaginationParams
  ): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const response = await apiClient.get<ApiResponse<ChatMessage[]>>(
        API_PATHS.CHAT.MESSAGES(conversationId),
        { params }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || '会話履歴の取得に失敗しました',
      };
    }
  }

  // 会話終了
  async endConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await apiClient.post<ApiResponse<Conversation>>(
        API_PATHS.CHAT.END_CONVERSATION(conversationId)
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || '会話の終了に失敗しました',
      };
    }
  }

  // チャット自動開始
  async startChat(data: {
    context: 'personal' | 'stylist_consultation' | 'client_direct';
    clientId?: string;
  }): Promise<ApiResponse<ConversationStartResponse>> {
    try {
      const response = await apiClient.post<ApiResponse<ConversationStartResponse>>(
        API_PATHS.CHAT.START,
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'チャットの開始に失敗しました',
      };
    }
  }
}