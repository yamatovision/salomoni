import { ChatMessageModel } from '../models/chat-message.model';
import { ChatMessage, MessageType, PaginationParams, PaginationInfo } from '../../../types';
import { logger } from '../../../common/utils/logger';

export class ChatMessageRepository {
  async create(data: Partial<ChatMessage>): Promise<ChatMessage> {
    try {
      const message = new ChatMessageModel(data);
      await message.save();
      return message.toJSON() as ChatMessage;
    } catch (error) {
      logger.error('メッセージ作成エラー:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<ChatMessage | null> {
    try {
      const message = await ChatMessageModel.findById(id);
      return message ? message.toJSON() as ChatMessage : null;
    } catch (error) {
      logger.error('メッセージ取得エラー:', error);
      throw error;
    }
  }

  async findByConversationId(
    conversationId: string,
    pagination?: PaginationParams,
    order: 'asc' | 'desc' = 'asc'
  ): Promise<{ messages: ChatMessage[]; pagination: PaginationInfo }> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const skip = (page - 1) * limit;
      const sortOrder = order === 'asc' ? 1 : -1;

      const [messages, totalItems] = await Promise.all([
        ChatMessageModel.find({ conversationId })
          .sort({ createdAt: sortOrder })
          .skip(skip)
          .limit(limit),
        ChatMessageModel.countDocuments({ conversationId }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        messages: messages.map(message => message.toJSON() as ChatMessage),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('会話のメッセージ取得エラー:', error);
      throw error;
    }
  }

  async getRecentMessages(
    conversationId: string,
    limit: number = 10
  ): Promise<ChatMessage[]> {
    try {
      const messages = await ChatMessageModel.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit);
      
      // 新しい順で取得したので、古い順に並び替えて返す
      return messages.reverse().map(message => message.toJSON() as ChatMessage);
    } catch (error) {
      logger.error('最近のメッセージ取得エラー:', error);
      throw error;
    }
  }

  async deleteByConversationId(conversationId: string): Promise<number> {
    try {
      const result = await ChatMessageModel.deleteMany({ conversationId });
      return result.deletedCount;
    } catch (error) {
      logger.error('会話のメッセージ削除エラー:', error);
      throw error;
    }
  }

  async createSystemMessage(
    conversationId: string,
    content: string,
    systemType: string = 'general'
  ): Promise<ChatMessage> {
    try {
      const message = new ChatMessageModel({
        conversationId,
        type: MessageType.SYSTEM,
        content,
        metadata: { systemType },
      });
      await message.save();
      return message.toJSON() as ChatMessage;
    } catch (error) {
      logger.error('システムメッセージ作成エラー:', error);
      throw error;
    }
  }

  async countMessages(conversationId: string, type?: MessageType): Promise<number> {
    try {
      const query: any = { conversationId };
      if (type) query.type = type;
      
      return await ChatMessageModel.countDocuments(query);
    } catch (error) {
      logger.error('メッセージカウントエラー:', error);
      throw error;
    }
  }

  async getMessageHistory(
    conversationId: string,
    beforeDate?: Date,
    limit: number = 20
  ): Promise<ChatMessage[]> {
    try {
      const query: any = { conversationId };
      if (beforeDate) {
        query.createdAt = { $lt: beforeDate };
      }

      const messages = await ChatMessageModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
      
      // 新しい順で取得したので、古い順に並び替えて返す
      return messages.reverse().map(message => message.toJSON() as ChatMessage);
    } catch (error) {
      logger.error('メッセージ履歴取得エラー:', error);
      throw error;
    }
  }

  async getMessageCount(conversationId: string): Promise<number> {
    try {
      const count = await ChatMessageModel.countDocuments({ conversationId });
      return count;
    } catch (error) {
      logger.error('メッセージ数取得エラー:', error);
      throw error;
    }
  }
}