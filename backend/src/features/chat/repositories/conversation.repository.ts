import { ConversationModel } from '../models/conversation.model';
import { Conversation, PaginationParams, PaginationInfo } from '../../../types';
import { logger } from '../../../common/utils/logger';

export class ConversationRepository {
  async create(data: Partial<Conversation>): Promise<Conversation> {
    try {
      const conversation = new ConversationModel(data);
      await conversation.save();
      return conversation.toJSON() as Conversation;
    } catch (error) {
      logger.error('会話作成エラー:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Conversation | null> {
    try {
      const conversation = await ConversationModel.findById(id);
      return conversation ? conversation.toJSON() as Conversation : null;
    } catch (error) {
      logger.error('会話取得エラー:', error);
      throw error;
    }
  }

  async findByUserId(
    userId: string,
    filters?: {
      context?: string;
      aiCharacterId?: string;
      isActive?: boolean;
    },
    pagination?: PaginationParams
  ): Promise<{ conversations: Conversation[]; pagination: PaginationInfo }> {
    try {
      const query: any = { userId };
      
      if (filters) {
        if (filters.context) query.context = filters.context;
        if (filters.aiCharacterId) query.aiCharacterId = filters.aiCharacterId;
        if (filters.isActive !== undefined) {
          if (filters.isActive) {
            query.endedAt = { $exists: false };
          } else {
            query.endedAt = { $exists: true };
          }
        }
      }

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const [conversations, totalItems] = await Promise.all([
        ConversationModel.find(query)
          .sort({ startedAt: -1 })
          .skip(skip)
          .limit(limit),
        ConversationModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        conversations: conversations.map(conv => conv.toJSON() as Conversation),
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
      logger.error('ユーザーの会話取得エラー:', error);
      throw error;
    }
  }

  async findByClientId(
    clientId: string,
    filters?: {
      context?: string;
      aiCharacterId?: string;
      isActive?: boolean;
    },
    pagination?: PaginationParams
  ): Promise<{ conversations: Conversation[]; pagination: PaginationInfo }> {
    try {
      const query: any = { clientId };
      
      if (filters) {
        if (filters.context) query.context = filters.context;
        if (filters.aiCharacterId) query.aiCharacterId = filters.aiCharacterId;
        if (filters.isActive !== undefined) {
          if (filters.isActive) {
            query.endedAt = { $exists: false };
          } else {
            query.endedAt = { $exists: true };
          }
        }
      }

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const [conversations, totalItems] = await Promise.all([
        ConversationModel.find(query)
          .sort({ startedAt: -1 })
          .skip(skip)
          .limit(limit),
        ConversationModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        conversations: conversations.map(conv => conv.toJSON() as Conversation),
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
      logger.error('クライアントの会話取得エラー:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Conversation>): Promise<Conversation | null> {
    try {
      const conversation = await ConversationModel.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      );
      return conversation ? conversation.toJSON() as Conversation : null;
    } catch (error) {
      logger.error('会話更新エラー:', error);
      throw error;
    }
  }

  async incrementMessageCount(id: string): Promise<void> {
    try {
      await ConversationModel.findByIdAndUpdate(
        id,
        { $inc: { messageCount: 1 } }
      );
    } catch (error) {
      logger.error('メッセージカウント更新エラー:', error);
      throw error;
    }
  }

  async endConversation(id: string): Promise<Conversation | null> {
    try {
      const conversation = await ConversationModel.findByIdAndUpdate(
        id,
        { endedAt: new Date() },
        { new: true }
      );
      return conversation ? conversation.toJSON() as Conversation : null;
    } catch (error) {
      logger.error('会話終了エラー:', error);
      throw error;
    }
  }

  async addMemoryUpdate(id: string, memoryId: string): Promise<void> {
    try {
      await ConversationModel.findByIdAndUpdate(
        id,
        { $addToSet: { memoryUpdates: memoryId } }
      );
    } catch (error) {
      logger.error('メモリ更新追加エラー:', error);
      throw error;
    }
  }

  async getActiveConversation(
    userId: string | undefined,
    clientId: string | undefined,
    aiCharacterId: string
  ): Promise<Conversation | null> {
    try {
      const query: any = {
        aiCharacterId,
        endedAt: { $exists: false },
      };
      
      if (userId) {
        query.userId = userId;
      } else if (clientId) {
        query.clientId = clientId;
      }

      const conversation = await ConversationModel.findOne(query)
        .sort({ startedAt: -1 });
        
      return conversation ? conversation.toJSON() as Conversation : null;
    } catch (error) {
      logger.error('アクティブ会話取得エラー:', error);
      throw error;
    }
  }
}