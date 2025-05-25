import { AIMemoryModel } from '../models/ai-memory.model';
import { AIMemory, PaginationParams, PaginationInfo } from '../../../types';
import { logger } from '../../../common/utils/logger';

export class AIMemoryRepository {
  async create(data: Partial<AIMemory>): Promise<AIMemory> {
    try {
      const memory = new AIMemoryModel(data);
      await memory.save();
      return memory.toJSON() as AIMemory;
    } catch (error) {
      logger.error('AIメモリ作成エラー:', error);
      throw error;
    }
  }

  async createBulk(memories: Partial<AIMemory>[]): Promise<AIMemory[]> {
    try {
      const createdMemories = await AIMemoryModel.insertMany(memories);
      return createdMemories.map(memory => memory.toJSON() as AIMemory);
    } catch (error) {
      logger.error('AIメモリ一括作成エラー:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<AIMemory | null> {
    try {
      const memory = await AIMemoryModel.findById(id);
      return memory ? memory.toJSON() as AIMemory : null;
    } catch (error) {
      logger.error('AIメモリ取得エラー:', error);
      throw error;
    }
  }

  async findByCharacterId(
    characterId: string,
    filters?: {
      category?: string;
      isActive?: boolean;
      memoryType?: string;
    },
    pagination?: PaginationParams
  ): Promise<{ memories: AIMemory[]; pagination: PaginationInfo }> {
    try {
      const query: any = { characterId };
      
      if (filters) {
        if (filters.category) query.category = filters.category;
        if (filters.isActive !== undefined) query.isActive = filters.isActive;
        if (filters.memoryType) query.memoryType = filters.memoryType;
      }

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const skip = (page - 1) * limit;

      const [memories, totalItems] = await Promise.all([
        AIMemoryModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        AIMemoryModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        memories: memories.map(memory => memory.toJSON() as AIMemory),
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
      logger.error('キャラクターのAIメモリ取得エラー:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<AIMemory>): Promise<AIMemory | null> {
    try {
      const memory = await AIMemoryModel.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      );
      return memory ? memory.toJSON() as AIMemory : null;
    } catch (error) {
      logger.error('AIメモリ更新エラー:', error);
      throw error;
    }
  }

  async updateMany(
    characterId: string,
    filter: any,
    update: any
  ): Promise<number> {
    try {
      const result = await AIMemoryModel.updateMany(
        { characterId, ...filter },
        update
      );
      return result.modifiedCount;
    } catch (error) {
      logger.error('AIメモリ一括更新エラー:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await AIMemoryModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('AIメモリ削除エラー:', error);
      throw error;
    }
  }

  async deleteByCharacterId(characterId: string): Promise<number> {
    try {
      const result = await AIMemoryModel.deleteMany({ characterId });
      return result.deletedCount;
    } catch (error) {
      logger.error('キャラクターのAIメモリ削除エラー:', error);
      throw error;
    }
  }

  async getActiveMemories(characterId: string): Promise<AIMemory[]> {
    try {
      const memories = await AIMemoryModel.find({ 
        characterId, 
        isActive: true 
      }).sort({ confidence: -1, createdAt: -1 });
      
      return memories.map(memory => memory.toJSON() as AIMemory);
    } catch (error) {
      logger.error('アクティブメモリ取得エラー:', error);
      throw error;
    }
  }
}