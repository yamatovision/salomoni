import { ConversationRepository } from '../repositories/conversation.repository';
import { ChatMessageRepository } from '../repositories/chat-message.repository';
import { AICharacterService } from '../../ai-characters/services/ai-character.service';
import { AIMemoryService } from '../../ai-characters/services/ai-memory.service';
import { OpenAIService } from './openai.service';
import { 
  Conversation, 
  ChatMessage, 
  MessageType, 
  PaginationParams,
  UserProfile,
  Client,
  AIMemoryType
} from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';

export class ChatService {
  private conversationRepository: ConversationRepository;
  private chatMessageRepository: ChatMessageRepository;
  private aiCharacterService: AICharacterService;
  private aiMemoryService: AIMemoryService;
  private openAIService: OpenAIService;

  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.chatMessageRepository = new ChatMessageRepository();
    this.aiCharacterService = new AICharacterService();
    this.aiMemoryService = new AIMemoryService();
    this.openAIService = new OpenAIService();
  }

  async createConversation(data: {
    userId?: string;
    clientId?: string;
    aiCharacterId: string;
    context: 'personal' | 'stylist_consultation' | 'client_direct';
  }): Promise<Conversation> {
    try {
      // コンテキストの整合性チェックを先に行う
      if (data.context === 'personal' && !data.userId) {
        throw new AppError('personalコンテキストの場合、userIdは必須です', 400, 'INVALID_CONTEXT');
      }
      if (data.context === 'client_direct' && !data.clientId) {
        throw new AppError('client_directコンテキストの場合、clientIdは必須です', 400, 'INVALID_CONTEXT');
      }

      // userIdとclientIdの排他チェック
      if (!data.userId && !data.clientId) {
        throw new AppError('userIdまたはclientIdのいずれかは必須です', 400, 'MISSING_USER_OR_CLIENT');
      }
      if (data.userId && data.clientId) {
        throw new AppError('userIdとclientIdは同時に設定できません', 400, 'BOTH_USER_AND_CLIENT');
      }

      // AIキャラクターの存在確認
      const aiCharacter = await this.aiCharacterService.getAICharacterById(data.aiCharacterId);
      if (!aiCharacter) {
        throw new AppError('指定されたAIキャラクターが存在しません', 400, 'AI_CHARACTER_NOT_FOUND');
      }

      // アクティブな会話がある場合は終了する
      const activeConversation = await this.conversationRepository.getActiveConversation(
        data.userId,
        data.clientId,
        data.aiCharacterId
      );
      
      if (activeConversation) {
        await this.conversationRepository.endConversation(activeConversation.id);
      }

      const conversation = await this.conversationRepository.create(data);
      
      // ウェルカムメッセージを作成
      await this.chatMessageRepository.createSystemMessage(
        conversation.id,
        '新しい会話が開始されました',
        'conversation_start'
      );

      logger.info(`会話作成完了: ${conversation.id}`);
      return conversation;
    } catch (error) {
      logger.error('会話作成エラー:', error);
      throw error;
    }
  }

  async getConversations(
    userId?: string,
    clientId?: string,
    filters?: {
      context?: string;
      aiCharacterId?: string;
      isActive?: boolean;
    },
    pagination?: PaginationParams
  ): Promise<{ conversations: Conversation[]; pagination: any }> {
    try {
      if (userId) {
        return await this.conversationRepository.findByUserId(userId, filters, pagination);
      } else if (clientId) {
        return await this.conversationRepository.findByClientId(clientId, filters, pagination);
      } else {
        throw new Error('userIdまたはclientIdが必要です');
      }
    } catch (error) {
      logger.error('会話一覧取得エラー:', error);
      throw error;
    }
  }

  async sendMessage(
    conversationId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    try {
      // 会話の存在確認
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        throw new AppError('指定された会話が存在しません', 400, 'CONVERSATION_NOT_FOUND');
      }

      if (conversation.endedAt) {
        throw new AppError('この会話は既に終了しています', 400, 'CONVERSATION_ENDED');
      }

      // AIキャラクターの取得
      const aiCharacter = await this.aiCharacterService.getAICharacterById(conversation.aiCharacterId);
      if (!aiCharacter) {
        throw new AppError('AIキャラクターが見つかりません', 400, 'AI_CHARACTER_NOT_FOUND');
      }

      // ユーザーメッセージを保存
      const userMessage = await this.chatMessageRepository.create({
        conversationId,
        type: MessageType.USER,
        content,
        metadata,
      });

      // 会話履歴を取得（最新20件）
      const recentMessages = await this.chatMessageRepository.getRecentMessages(conversationId, 20);

      // AIメモリコンテキストを取得
      const memoryContext = await this.aiMemoryService.getMemoryContext(aiCharacter.id);

      // OpenAIでAI応答を生成
      const aiResponse = await this.openAIService.generateResponse({
        messages: recentMessages,
        aiCharacter,
        memoryContext,
        contextType: conversation.context,
      });

      // AI応答メッセージを保存
      const aiMessage = await this.chatMessageRepository.create({
        conversationId,
        type: MessageType.AI,
        content: aiResponse,
      });

      // メッセージカウントを更新
      await this.conversationRepository.incrementMessageCount(conversationId);
      await this.conversationRepository.incrementMessageCount(conversationId);

      // 最終インタラクションを更新
      await this.aiCharacterService.updateLastInteraction(aiCharacter.id);

      // 会話からメモリを抽出（非同期で実行）
      this.extractAndSaveMemories(conversation, userMessage.content + '\n' + aiMessage.content)
        .catch(error => logger.error('メモリ抽出エラー:', error));

      logger.info(`メッセージ送信完了: 会話${conversationId}`);
      return { userMessage, aiMessage };
    } catch (error) {
      logger.error('メッセージ送信エラー:', error);
      throw error;
    }
  }

  async getMessages(
    conversationId: string,
    pagination?: PaginationParams,
    order: 'asc' | 'desc' = 'asc'
  ): Promise<{ messages: ChatMessage[]; pagination: any }> {
    try {
      return await this.chatMessageRepository.findByConversationId(
        conversationId,
        pagination,
        order
      );
    } catch (error) {
      logger.error('メッセージ取得エラー:', error);
      throw error;
    }
  }

  async endConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const conversation = await this.conversationRepository.endConversation(conversationId);
      
      if (conversation) {
        // 終了メッセージを作成
        await this.chatMessageRepository.createSystemMessage(
          conversationId,
          '会話が終了しました',
          'conversation_end'
        );
        
        logger.info(`会話終了: ${conversationId}`);
      }
      
      return conversation;
    } catch (error) {
      logger.error('会話終了エラー:', error);
      throw error;
    }
  }

  private async extractAndSaveMemories(
    conversation: Conversation,
    conversationContent: string
  ): Promise<void> {
    try {
      // OpenAIでメモリを抽出
      const extractedMemories = await this.openAIService.extractMemories(conversationContent);
      
      if (extractedMemories.length > 0) {
        // 抽出されたメモリを保存
        const savedMemories = await this.aiMemoryService.createBulkMemories(
          conversation.aiCharacterId,
          extractedMemories.map(memory => ({
            memoryType: AIMemoryType.AUTO,
            content: memory.content,
            category: memory.category as any,
            extractedFrom: conversationContent.substring(0, 200),
            confidence: memory.confidence,
          }))
        );

        // 会話にメモリ更新を記録
        for (const memory of savedMemories) {
          await this.conversationRepository.addMemoryUpdate(conversation.id, memory.id);
        }
        
        logger.info(`メモリ抽出完了: ${savedMemories.length}件`);
      }
    } catch (error) {
      logger.error('メモリ抽出・保存エラー:', error);
    }
  }

  async getOrCreateConversation(
    user?: UserProfile,
    client?: Client,
    context: 'personal' | 'stylist_consultation' | 'client_direct' = 'personal'
  ): Promise<Conversation> {
    try {
      // AIキャラクターを取得または作成
      const aiCharacter = await this.aiCharacterService.getOrCreateAICharacter(user, client);
      
      // アクティブな会話を検索
      let conversation = await this.conversationRepository.getActiveConversation(
        user?.id,
        client?.id,
        aiCharacter.id
      );
      
      // アクティブな会話がない場合は新規作成
      if (!conversation) {
        conversation = await this.createConversation({
          userId: user?.id,
          clientId: client?.id,
          aiCharacterId: aiCharacter.id,
          context,
        });
      }
      
      return conversation;
    } catch (error) {
      logger.error('会話取得/作成エラー:', error);
      throw error;
    }
  }
}